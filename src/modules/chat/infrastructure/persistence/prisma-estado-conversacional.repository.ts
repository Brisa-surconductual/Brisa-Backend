import { Prisma } from '@prisma/client';
import {
  EstadoConversacionalTransaccion,
  PasoConversacional,
} from '../../application/ports/estado-conversacional.port';
import { validarHistorialSesion } from './prisma-validar-historial-sesion';

export class PrismaEstadoConversacionalRepository implements EstadoConversacionalTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async insertarPaso(paso: PasoConversacional): Promise<void> {
    await this.tx.$executeRaw`
      INSERT INTO chat.historial_nodos (
        id_sesion, id_nodo, id_usuario, respuesta_usuario,
        id_nodo_destino, timestamp_interaccion, id_interaccion
      ) VALUES (
        ${paso.idSesion}::uuid, ${paso.idNodoOrigen}::uuid, ${paso.idUsuario}::uuid,
        ${JSON.stringify(paso.valor)}::jsonb, ${paso.idNodoDestino}::uuid,
        ${paso.timestampInteraccion}::timestamptz, ${paso.idInteraccion}::uuid
      )`;
  }

  async avanzarDesdeOrigen(paso: PasoConversacional): Promise<boolean> {
    const { count } = await this.tx.chat_sesiones.updateMany({
      where: {
        id_sesion: paso.idSesion,
        id_nodo_actual: paso.idNodoOrigen,
      },
      data: {
        id_nodo_actual: paso.idNodoDestino,
        fecha_ultima_interaccion: paso.ahora,
      },
    });
    return count === 1;
  }

  async actualizarEstado(paso: PasoConversacional): Promise<void> {
    await this.tx.estado_sesiones.update({
      where: { id_sesion: paso.idSesion },
      data: {
        estado_actual: paso.esTerminal ? 'COMPLETADA' : 'ACTIVA',
        fecha_actualizacion: paso.ahora,
        ...(paso.esTerminal && { fecha_completada: paso.ahora }),
      },
    });
  }

  validarHistorial(idSesion: string): Promise<boolean> {
    return validarHistorialSesion(this.tx, idSesion);
  }
}
