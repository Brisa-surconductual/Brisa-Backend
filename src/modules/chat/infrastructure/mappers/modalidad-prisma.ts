import type { Prisma } from '@prisma/client';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';

type ModalidadPrisma =
  Prisma.flujo_conversacionUncheckedCreateInput['modalidad'];

/**
 * RF-43: `schema.prisma` se regenera desde las migraciones después del merge
 * (workflow `prisma-generate-schema`). Mientras tanto, el enum del cliente no
 * incluye `SOS`, aunque la base de datos sí lo acepta. Esta conversión permite
 * que el código compile contra el cliente vigente sin editar el esquema.
 */
export function modalidadPrisma(
  modalidad: ModalidadConversacional,
): ModalidadPrisma {
  return modalidad as unknown as ModalidadPrisma;
}
