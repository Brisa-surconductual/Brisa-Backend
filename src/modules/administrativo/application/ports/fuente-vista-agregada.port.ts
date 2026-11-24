export type ResultadoFuenteAgregada = { id_cohorte: string } & (
  | { estado: 'ACTUALIZADO'; datos: unknown }
  | { estado: 'PENDIENTE' | 'SUPRIMIDO' | 'NO_DISPONIBLE' }
);

export interface FuenteVistaAgregada {
  obtener(idCohorte: string): Promise<ResultadoFuenteAgregada>;
}

export function fuenteAgregadaNoDisponible(
  id_cohorte: string,
): ResultadoFuenteAgregada {
  return { id_cohorte, estado: 'NO_DISPONIBLE' };
}
