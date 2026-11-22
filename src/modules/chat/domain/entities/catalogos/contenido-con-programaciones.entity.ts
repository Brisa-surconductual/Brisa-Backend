/** Dónde está programado un contenido: cronograma, unidad temporal y fechas de la plantilla. */
export interface ProgramacionContenido {
  readonly idContenidoCronograma: string;
  readonly idCronograma: string;
  readonly nombreCronograma: string;
  readonly estadoCronograma: string;
  readonly idUnidadTemporal: string;
  readonly ordenUnidad: number;
  readonly nombreUnidad: string;
  readonly fechaInicioUnidad: Date;
  readonly fechaFinUnidad: Date;
  readonly fechaInicioDisponibilidad: Date | null;
  readonly fechaFinDisponibilidad: Date | null;
}

/**
 * RF-25 / RF-24: contenido que se puede ligar a un nodo. Un mismo flujo sirve
 * a varios cronogramas: cada estudiante recorre el contenido según su
 * programación en su propio cronograma. `programaciones` puede estar vacía
 * (contenido aún no programado: no bloquea a nadie).
 */
export class ContenidoConProgramaciones {
  constructor(
    readonly idContenido: string,
    readonly nombreContenido: string,
    readonly tipoContenido: string,
    readonly programaciones: readonly ProgramacionContenido[],
  ) {}
}
