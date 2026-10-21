export interface EstadisticasPrograma {
  estudiantesActivos: number;
  conRegistroCompleto: number;
  conRegistroPendiente: number;
  diasCronogramaBase: number | null;
}

export abstract class EstadisticasProgramaRepository {
  abstract consultar(): Promise<EstadisticasPrograma>;
}
