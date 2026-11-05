/** Contenido del cronograma que el usuario puede consultar hoy desde el chat. */
export class ContenidoVigenteChat {
  constructor(
    readonly idContenido: string,
    readonly idContenidoCronograma: string,
    readonly nombreContenido: string,
    readonly tipoContenido: string,
    readonly idUnidadTemporal: string,
    readonly nombreUnidad: string,
    readonly ordenUnidad: number,
    readonly ordenContenido: number | null,
    readonly fechaInicioDisponibilidad: Date,
    readonly fechaFinDisponibilidad: Date,
    readonly estadoDisponibilidad: string,
  ) {}
}
