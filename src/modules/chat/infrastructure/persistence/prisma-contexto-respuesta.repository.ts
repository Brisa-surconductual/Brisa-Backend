import { Prisma } from '@prisma/client';
import { ContextoRespuestaTransaccion } from '../../application/ports/procesar-respuesta.port';
import { NodoConversacionalMapper } from '../mappers/nodo-conversacional.mapper';
import {
  esNodoTerminal,
  extrasNodos,
  idSiguienteNodoPorOrden,
} from './consultas-nodo-extra';
import { conTipoNodo } from './catalogo-tipos-cache';
import {
  SesionConEstadoFila,
  SesionConversacionalMapper,
} from '../mappers/sesion-conversacional.mapper';
import {
  INCLUIR_REGLA_DE_TRANSICION,
  TransicionConversacionalMapper,
} from '../mappers/transicion-conversacional.mapper';

type FilaSesionBloqueada = {
  id_sesion: string;
  id_usuario: string;
  id_flujo_conversacional: string | null;
  version_arbol_utilizada: number | null;
  modalidad_activa: string;
  tipo_dependencia: string | null;
  tipo_craving: string | null;
  id_nodo_actual: string | null;
  fecha_inicio: Date;
  fecha_ultima_interaccion: Date;
  estado_actual: string;
};

/** Consultas de la transacción; no decide permisos, estados o rutas. */
export class PrismaContextoRespuestaRepository implements ContextoRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async bloquearSesion(idSesion: string, idUsuario: string) {
    // Una sola consulta bloquea sesión y estado y trae sus datos: antes eran
    // cuatro viajes (dos bloqueos y la lectura con `include`).
    const [fila] = await this.tx.$queryRaw<FilaSesionBloqueada[]>`
      SELECT s.id_sesion, s.id_usuario, s.id_flujo_conversacional,
             s.version_arbol_utilizada, s.modalidad_activa::text AS modalidad_activa,
             s.tipo_dependencia::text AS tipo_dependencia,
             s.tipo_craving::text AS tipo_craving, s.id_nodo_actual,
             s.fecha_inicio, s.fecha_ultima_interaccion,
             e.estado_actual::text AS estado_actual
      FROM chat.sesiones s
      JOIN chat.estado_sesiones e ON e.id_sesion = s.id_sesion
      WHERE s.id_sesion = ${idSesion}::uuid AND s.id_usuario = ${idUsuario}::uuid
      FOR UPDATE OF s, e`;
    if (fila === undefined) return null;
    return SesionConversacionalMapper.toDomain({
      ...fila,
      estado_sesiones: { estado_actual: fila.estado_actual },
    } as unknown as SesionConEstadoFila);
  }

  async buscarNodo(idNodo: string) {
    const base = await this.tx.nodos.findUnique({ where: { id_nodo: idNodo } });
    if (base === null) return null;
    const [fila] = await conTipoNodo(this.tx, [base]);
    // RF-24: el contenido del nodo decide su habilitación por cronograma.
    const extras = await extrasNodos(this.tx, [fila.id_nodo]);
    return NodoConversacionalMapper.toDomain(fila, extras.get(fila.id_nodo));
  }

  async buscarTransiciones(idNodo: string) {
    const filas = await this.tx.reglas_nodos.findMany({
      where: { id_nodo_origen: idNodo },
      include: INCLUIR_REGLA_DE_TRANSICION,
      orderBy: [{ orden_evaluacion: 'asc' }, { id_regla: 'asc' }],
    });
    return filas.map((f) => TransicionConversacionalMapper.toDomain(f));
  }

  esTerminal(idNodo: string, idFlujo: string): Promise<boolean> {
    return esNodoTerminal(this.tx, idNodo, idFlujo);
  }

  siguienteNodoImplicito(idNodo: string): Promise<string | null> {
    return idSiguienteNodoPorOrden(this.tx, idNodo);
  }

  async estadoIntervencionSos(
    idSesion: string,
  ): Promise<{ enCurso: boolean; vencida: boolean } | null> {
    const [fila] = await this.tx.$queryRaw<
      { en_curso: boolean; vencida: boolean }[]
    >`
      SELECT estado = 'EN_CURSO' AS en_curso,
        statement_timestamp() >= fecha_limite AS vencida
      FROM chat.intervenciones_sos
      WHERE id_sesion_sos = ${idSesion}::uuid
      FOR SHARE`;
    return fila === undefined
      ? null
      : { enCurso: fila.en_curso, vencida: fila.vencida };
  }
}
