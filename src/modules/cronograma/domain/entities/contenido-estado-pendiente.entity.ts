import { EstadoContenido } from '../enums/estado-contenido.enum';
import { CambioEstadoContenidoInvalidoException } from '../exeption/cambio-estado-contenido-invalido.exception';

export interface TransicionEstadoContenido {
  readonly estado_anterior: EstadoContenido | null;
  readonly estado_nuevo: EstadoContenido;
}

export class ContenidoEstadoPendiente {
  private static readonly secuencia = [
    EstadoContenido.PROGRAMADO,
    EstadoContenido.ACTIVO,
    EstadoContenido.FINALIZADO,
  ] as const;

  constructor(
    readonly id_contenido_cronograma: string,
    readonly id_contenido: string,
    readonly id_cronograma: string,
    readonly estado_actual: EstadoContenido,
    readonly ultimo_estado_publicado: EstadoContenido | null,
  ) {}

  obtenerTransicionesPendientes(): readonly TransicionEstadoContenido[] {
    const indiceActual = ContenidoEstadoPendiente.secuencia.indexOf(
      this.estado_actual,
    );
    const indiceUltimo = this.ultimo_estado_publicado
      ? ContenidoEstadoPendiente.secuencia.indexOf(this.ultimo_estado_publicado)
      : -1;

    if (indiceActual < 0 || indiceUltimo > indiceActual) {
      throw new CambioEstadoContenidoInvalidoException();
    }

    const transiciones: TransicionEstadoContenido[] = [];

    for (let indice = indiceUltimo + 1; indice <= indiceActual; indice += 1) {
      transiciones.push({
        estado_anterior:
          indice === 0 ? null : ContenidoEstadoPendiente.secuencia[indice - 1],
        estado_nuevo: ContenidoEstadoPendiente.secuencia[indice],
      });
    }

    return transiciones;
  }
}
