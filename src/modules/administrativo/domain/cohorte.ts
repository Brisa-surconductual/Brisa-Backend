export const ESTADOS_COHORTE = ['BORRADOR', 'ACTIVA', 'INACTIVA'] as const;

export type EstadoCohorte = (typeof ESTADOS_COHORTE)[number];

export type OperacionCohorte = 'CREAR' | 'EDITAR' | 'ACTIVAR' | 'INACTIVAR';

export interface DatosCohorte {
  nombre_cohorte: string;
  fecha_inicio_programa: string;
  fecha_fin_programa: string;
  id_cronograma: string;
}

export interface Cohorte extends DatosCohorte {
  id_cohorte: string;
  estado: EstadoCohorte;
  fecha_actualizacion: string;
}
