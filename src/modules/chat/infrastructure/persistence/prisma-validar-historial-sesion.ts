import { Prisma } from '@prisma/client';

export async function validarHistorialSesion(
  tx: Prisma.TransactionClient,
  idSesion: string,
): Promise<boolean> {
  const [resultado] = await tx.$queryRaw<{ valido: boolean }[]>`
    SELECT chat.fn_validar_historial_sesion(${idSesion}::uuid) AS valido
  `;
  return resultado.valido;
}
