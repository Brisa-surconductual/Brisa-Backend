import { Prisma } from '@prisma/client';
import { ContextoRespuestaTransaccion } from '../../application/ports/procesar-respuesta.port';
import { NodoConversacionalMapper } from '../mappers/nodo-conversacional.mapper';
import {
  esNodoTerminal,
  extrasNodos,
  idSiguienteNodoPorOrden,
} from './consultas-nodo-extra';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';
import {
  INCLUIR_REGLA_DE_TRANSICION,
  TransicionConversacionalMapper,
} from '../mappers/transicion-conversacional.mapper';

/** Consultas de la transacción; no decide permisos, estados o rutas. */
export class PrismaContextoRespuestaRepository implements ContextoRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async bloquearSesion(idSesion: string, idUsuario: string) {
    const filas = await this.tx.$queryRaw<{ id_sesion: string }[]>`
      SELECT id_sesion FROM chat.sesiones
      WHERE id_sesion = ${idSesion}::uuid AND id_usuario = ${idUsuario}::uuid FOR UPDATE`;
    if (filas.length === 0) return null;
    await this.tx
      .$queryRaw`SELECT id_sesion FROM chat.estado_sesiones WHERE id_sesion = ${idSesion}::uuid FOR UPDATE`;
    const sesion = await this.tx.chat_sesiones.findUnique({
      where: { id_sesion: idSesion },
      include: { estado_sesiones: true },
    });
    return sesion?.estado_sesiones == null
      ? null
      : SesionConversacionalMapper.toDomain(sesion);
  }

  async buscarNodo(idNodo: string) {
    const fila = await this.tx.nodos.findUnique({
      where: { id_nodo: idNodo },
      include: { tipo_nodo: { select: { nombre: true } } },
    });
    if (fila === null) return null;
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
