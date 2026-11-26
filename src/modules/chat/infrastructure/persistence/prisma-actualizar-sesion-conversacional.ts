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
  // RF-43: hoy la única causa de pausa definida es el protocolo SOS.
  const pausada =
    estadoPrevio === 'ACTIVA' && sesion.estadoActual === 'PAUSADA';
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
      ...(pausada && { fecha_pausa: ahora, motivo_pausa: 'SOS_CRAVING' }),
    },
  });
}
