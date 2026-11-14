import { Prisma } from '@prisma/client';
import { ContextoRespuestaTransaccion } from '../../application/ports/procesar-respuesta.port';
import { NodoConversacionalMapper } from '../mappers/nodo-conversacional.mapper';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';
import { TransicionConversacionalMapper } from '../mappers/transicion-conversacional.mapper';

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
    return fila === null ? null : NodoConversacionalMapper.toDomain(fila);
  }

  async buscarTransiciones(idNodo: string) {
    const filas = await this.tx.reglas_nodos.findMany({
      where: { id_nodo_origen: idNodo },
      include: {
        nodos_reglas_nodos_id_nodo_origen_id_flujoTonodos: {
          include: { reglas_validaciones: true },
        },
      },
      orderBy: [{ orden_evaluacion: 'asc' }, { id_regla: 'asc' }],
    });
    return filas.map((f) => TransicionConversacionalMapper.toDomain(f));
  }

  async tieneSalidas(idNodo: string, idFlujo: string): Promise<boolean> {
    return (
      (await this.tx.reglas_nodos.count({
        where: { id_nodo_origen: idNodo, id_flujo: idFlujo },
      })) > 0
    );
  }
}
