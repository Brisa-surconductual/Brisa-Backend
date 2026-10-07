import { EstadoContenido } from '../enums/estado-contenido.enum';
import { TipoContenido } from '../enums/tipo-contenido.enum';

export class ContenidoVigenteUsuario {
  constructor(
    readonly idContenido: string,
    readonly idContenidoCronograma: string,
    readonly nombreContenido: string,
    readonly tipoContenido: TipoContenido,
    readonly idUnidadTemporal: string,
    readonly nombreUnidad: string,
    readonly ordenUnidad: number,
    readonly ordenContenido: number | null,
    readonly fechaInicioDisponibilidad: Date,
    readonly fechaFinDisponibilidad: Date,
    readonly estadoDisponibilidad: EstadoContenido,
  ) {}
}
