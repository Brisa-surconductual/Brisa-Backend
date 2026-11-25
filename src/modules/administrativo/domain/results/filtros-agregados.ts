import type { TipoVistaAgregada } from '../enums/tipo-vista-agregada.enum';
import type { DatosVistaAgregada, VistaAgregada } from './vista-agregada';

export interface FiltrosAgregados {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_unidad_temporal?: string;
  modalidad_terapeutica?: 'GRUPAL' | 'PERSONALIZADA';
}

export const CAMPOS_FILTRO_AGREGADO = [
  'fecha_inicio',
  'fecha_fin',
  'id_unidad_temporal',
  'modalidad_terapeutica',
] as const satisfies ReadonlyArray<keyof FiltrosAgregados>;

export type CampoFiltroAgregado = (typeof CAMPOS_FILTRO_AGREGADO)[number];
export type ObjetivoVistaAgregada = TipoVistaAgregada | 'TODAS';

export interface FiltrosPorVista {
  filtros_aplicados: FiltrosAgregados;
  filtros_omitidos: CampoFiltroAgregado[];
  advertencia?: string;
}

export type VistaFiltrada = VistaAgregada<DatosVistaAgregada> & FiltrosPorVista;

export interface VistasFiltradas {
  filtros_aplicados: FiltrosAgregados;
  vistas: Partial<Record<TipoVistaAgregada, VistaFiltrada>>;
}
