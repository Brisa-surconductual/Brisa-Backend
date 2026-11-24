export type ResultadoSeguimientoAgregado = { id_cohorte: string } & (
  | { estado: 'ACTUALIZADO'; datos: unknown }
  | { estado: 'PENDIENTE' | 'SUPRIMIDO' | 'NO_DISPONIBLE' }
);

export abstract class SeguimientoAgregadoPort {
  abstract obtener(idCohorte: string): Promise<ResultadoSeguimientoAgregado>;
}
