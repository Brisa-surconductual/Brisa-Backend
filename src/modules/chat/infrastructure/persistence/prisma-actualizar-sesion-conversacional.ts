import { Prisma } from '@prisma/client';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { SesionConversacionalMapper } from '../mappers/sesion-conversacional.mapper';

export async function actualizarSesionConversacional(
  tx: Prisma.TransactionClient,
  sesion: SesionConversacional,
  estadoPrevio: string | undefined,
): Promise<void> {
  const ahora = new Date();
  const reanudada =
    estadoPrevio === 'PAUSADA' && sesion.estadoActual === 'ACTIVA';
  await tx.chat_sesiones.update({
    where: { id_sesion: sesion.idSesion },
    data: SesionConversacionalMapper.toProgressUpdateData(sesion),
  });
  await tx.estado_sesiones.update({
    where: { id_sesion: sesion.idSesion },
    data: {
      estado_actual: sesion.estadoActual,
      fecha_actualizacion: ahora,
      ...(reanudada && { fecha_reanudacion: ahora }),
    },
  });
}
