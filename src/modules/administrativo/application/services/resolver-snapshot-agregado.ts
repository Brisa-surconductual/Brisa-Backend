import type { Prisma } from '@prisma/client';
import type { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import type { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { DatosVistaAgregada } from '../../domain/results/vista-agregada';
import { esSnapshotSuprimido } from '../../domain/value-objects/snapshot-agregado.vo';

/** Mantiene la política de precedencia del respaldo general de RF-132 a RF-134. */
export async function resolverSnapshotAgregado<T extends DatosVistaAgregada>(
  repositorio: VistasAgregadasRepository,
  tx: Prisma.TransactionClient,
  idCohorte: string,
  tipo: TipoVistaAgregada,
  datos: T,
  proyectar: (valor: unknown) => T | null,
) {
  if (await repositorio.guardar(tx, idCohorte, tipo, datos))
    return { datos, suprimido: false };

  const ultimo = await repositorio.obtenerUltimo(tx, idCohorte, tipo);
  const suprimido = esSnapshotSuprimido(ultimo);
  return { datos: suprimido ? null : proyectar(ultimo), suprimido };
}
