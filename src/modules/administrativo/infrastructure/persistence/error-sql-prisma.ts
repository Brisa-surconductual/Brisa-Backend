import { Prisma } from '@prisma/client';

type ErrorAdaptadorSql = {
  cause?: { originalCode?: unknown; originalMessage?: unknown };
};

export function errorSqlPrisma(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2010'
  )
    return;
  const meta = error.meta;
  const adaptador = meta?.driverAdapterError as ErrorAdaptadorSql | undefined;
  return {
    estado: adaptador?.cause?.originalCode ?? meta?.code,
    mensaje: adaptador?.cause?.originalMessage ?? meta?.message,
  };
}
