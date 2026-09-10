export class UbicacionTemporalUsuario {
  constructor(
    readonly idUsuario: string,
    readonly idCronogramaUsuario: string,
    readonly idCronograma: string,
    readonly idUnidadTemporal: string | null,
    readonly nombreUnidad: string | null,
    readonly ordenUnidad: number | null,
    readonly fechaCalculo: Date,
    readonly tiempoEfectivoTranscurridoSegundos: number,
    readonly cronogramaFinalizado: boolean,
    readonly mensaje: string | null,
  ) {}
}
