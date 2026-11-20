import { randomUUID } from 'crypto';
import { ReglaValidacion } from '../reglas-validacion/reglas-validacion.entity';

/**
 * RF-25: la transición solo une dos nodos con un orden de evaluación; cuándo
 * se toma lo decide su regla propia (`null` solo si el origen no espera
 * respuesta, CONTINUAR).
 */
export class TransicionConversacional {
  constructor(
    readonly idTransicion: string,
    readonly idFlujo: string,
    readonly idNodoOrigen: string,
    readonly idNodoDestino: string,
    readonly ordenEvaluacion: number,
    readonly reglaValidacion: ReglaValidacion | null,
    readonly fechaCreacion: Date,
  ) {}

  static crear(
    idFlujo: string,
    idNodoOrigen: string,
    idNodoDestino: string,
    ordenEvaluacion: number,
    reglaValidacion: ReglaValidacion | null,
  ): TransicionConversacional {
    return new TransicionConversacional(
      randomUUID(),
      idFlujo,
      idNodoOrigen,
      idNodoDestino,
      ordenEvaluacion,
      reglaValidacion,
      new Date(),
    );
  }

  /** Aplica los cambios indicados; `undefined` conserva el valor actual. */
  actualizar(cambios: {
    idNodoDestino?: string;
    ordenEvaluacion?: number;
    reglaValidacion?: ReglaValidacion | null;
  }): TransicionConversacional {
    return new TransicionConversacional(
      this.idTransicion,
      this.idFlujo,
      this.idNodoOrigen,
      cambios.idNodoDestino ?? this.idNodoDestino,
      cambios.ordenEvaluacion ?? this.ordenEvaluacion,
      cambios.reglaValidacion === undefined
        ? this.reglaValidacion
        : cambios.reglaValidacion,
      this.fechaCreacion,
    );
  }

  copiarEn(
    idFlujo: string,
    idNodoOrigen: string,
    idNodoDestino: string,
    reglaValidacion: ReglaValidacion | null,
  ): TransicionConversacional {
    return new TransicionConversacional(
      randomUUID(),
      idFlujo,
      idNodoOrigen,
      idNodoDestino,
      this.ordenEvaluacion,
      reglaValidacion,
      new Date(),
    );
  }
}
