import { randomUUID } from 'crypto';
import { OperadorCondicion } from '../../enums/operador-condicional.enum';
import { ReglaValidacion } from '../reglas-validacion/reglas-validacion.entity';

export class TransicionConversacional {
  constructor(
    readonly idTransicion: string,
    readonly idFlujo: string,
    readonly idNodoOrigen: string,
    readonly idNodoDestino: string,
    readonly operadorCondicion: OperadorCondicion,
    readonly valorCondicion: unknown,
    readonly ordenEvaluacion: number,
    readonly reglaValidacion: ReglaValidacion,
    readonly fechaCreacion: Date,
  ) {}

  static crear(
    idFlujo: string,
    idNodoOrigen: string,
    idNodoDestino: string,
    operadorCondicion: OperadorCondicion,
    valorCondicion: unknown,
    ordenEvaluacion: number,
    reglaValidacion: ReglaValidacion,
  ): TransicionConversacional {
    return new TransicionConversacional(
      randomUUID(),
      idFlujo,
      idNodoOrigen,
      idNodoDestino,
      operadorCondicion,
      valorCondicion,
      ordenEvaluacion,
      reglaValidacion,
      new Date(),
    );
  }

  /** Aplica los cambios indicados; `undefined` conserva el valor actual. */
  actualizar(
    cambios: Partial<
      Pick<
        TransicionConversacional,
        | 'idNodoOrigen'
        | 'idNodoDestino'
        | 'operadorCondicion'
        | 'valorCondicion'
        | 'ordenEvaluacion'
        | 'reglaValidacion'
      >
    >,
  ): TransicionConversacional {
    return new TransicionConversacional(
      this.idTransicion,
      this.idFlujo,
      cambios.idNodoOrigen ?? this.idNodoOrigen,
      cambios.idNodoDestino ?? this.idNodoDestino,
      cambios.operadorCondicion ?? this.operadorCondicion,
      cambios.valorCondicion === undefined
        ? this.valorCondicion
        : cambios.valorCondicion,
      cambios.ordenEvaluacion ?? this.ordenEvaluacion,
      cambios.reglaValidacion ?? this.reglaValidacion,
      this.fechaCreacion,
    );
  }

  copiarEn(
    idFlujo: string,
    idNodoOrigen: string,
    idNodoDestino: string,
    reglaValidacion: ReglaValidacion,
  ): TransicionConversacional {
    return new TransicionConversacional(
      randomUUID(),
      idFlujo,
      idNodoOrigen,
      idNodoDestino,
      this.operadorCondicion,
      this.valorCondicion,
      this.ordenEvaluacion,
      reglaValidacion,
      new Date(),
    );
  }
}
