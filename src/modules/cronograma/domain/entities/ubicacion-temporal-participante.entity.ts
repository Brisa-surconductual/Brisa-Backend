import { EstadoCronograma } from '../enums/estado-cronograma.enum';

export class UbicacionTemporalParticipante {
  constructor(
    readonly idUsuario: string,
    readonly correoElectronico: string,
    readonly idCronogramaUsuario: string | null,
    readonly idCronograma: string | null,
    readonly nombreCronograma: string | null,
    readonly estadoCronograma: EstadoCronograma | null,
    readonly fechaInicioUsuario: Date | null,
    readonly idUnidadTemporal: string | null,
    readonly nombreUnidad: string | null,
    readonly ordenUnidad: number | null,
    readonly fechaInicioUnidad: Date | null,
    readonly fechaFinUnidad: Date | null,
    readonly fechaCalculo: Date,
    readonly tiempoEfectivoTranscurridoSegundos: number | null,
    readonly cronogramaFinalizado: boolean | null,
    readonly enPausaAdministrativa: boolean,
    readonly mensaje: string | null,
  ) {}
}
