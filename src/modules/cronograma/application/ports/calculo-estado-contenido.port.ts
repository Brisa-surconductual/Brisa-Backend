import { EstadoContenido } from '../../domain/enums/estado-contenido.enum'

export abstract class CalculoEstadoContenidoPort {
  abstract calcular(
    fechaInicio: Date | null,
    fechaFin: Date | null,
  ): Promise<EstadoContenido>;
}