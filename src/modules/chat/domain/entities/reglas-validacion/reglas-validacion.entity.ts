import { randomUUID } from 'crypto';
import { TipoDatoValidacion } from '../../enums/tipo-dato-validacion-enum';
import { ReglaValidacionInvalidaException } from '../../exceptions';

export class ReglaValidacion {
  constructor(
    readonly idReglaValidacion: string,
    readonly tipoDato: TipoDatoValidacion,
    readonly obligatorio: boolean,
    readonly valorMin: number | null,
    readonly valorMax: number | null,
    readonly formatoRegex: string | null,
    readonly valoresPermitidos: string[],
    readonly mensajeError: string,
  ) {
    this.validar();
  }

  static crear(
    tipoDato: TipoDatoValidacion,
    obligatorio: boolean,
    valorMin: number | null,
    valorMax: number | null,
    formatoRegex: string | null,
    valoresPermitidos: string[],
    mensajeError: string,
  ): ReglaValidacion {
    return new ReglaValidacion(
      randomUUID(),
      tipoDato,
      obligatorio,
      valorMin,
      valorMax,
      formatoRegex,
      valoresPermitidos,
      mensajeError,
    );
  }

  /** Mismos datos con otro identificador (para no compartir la regla entre árboles). */
  copiar(): ReglaValidacion {
    return new ReglaValidacion(
      randomUUID(),
      this.tipoDato,
      this.obligatorio,
      this.valorMin,
      this.valorMax,
      this.formatoRegex,
      this.valoresPermitidos,
      this.mensajeError,
    );
  }

  /** Devuelve la regla con los cambios aplicados; `undefined` conserva el valor actual. */
  modificar(
    cambios: Partial<
      Pick<
        ReglaValidacion,
        | 'tipoDato'
        | 'obligatorio'
        | 'valorMin'
        | 'valorMax'
        | 'formatoRegex'
        | 'valoresPermitidos'
        | 'mensajeError'
      >
    >,
  ): ReglaValidacion {
    return new ReglaValidacion(
      this.idReglaValidacion,
      cambios.tipoDato ?? this.tipoDato,
      cambios.obligatorio ?? this.obligatorio,
      cambios.valorMin === undefined ? this.valorMin : cambios.valorMin,
      cambios.valorMax === undefined ? this.valorMax : cambios.valorMax,
      cambios.formatoRegex === undefined
        ? this.formatoRegex
        : cambios.formatoRegex,
      cambios.valoresPermitidos ?? this.valoresPermitidos,
      cambios.mensajeError ?? this.mensajeError,
    );
  }

  private validar(): void {
    if (
      this.valorMin !== null &&
      this.valorMax !== null &&
      this.valorMin > this.valorMax
    ) {
      throw new ReglaValidacionInvalidaException(
        'El valor mínimo no puede ser mayor que el valor máximo.',
      );
    }

    if (
      this.tipoDato !== TipoDatoValidacion.NUMERICO &&
      (this.valorMin !== null || this.valorMax !== null)
    ) {
      throw new ReglaValidacionInvalidaException(
        'Los límites mínimo y máximo solo aplican a validaciones numéricas.',
      );
    }

    if (this.formatoRegex !== null) {
      if (this.tipoDato !== TipoDatoValidacion.TEXTO) {
        throw new ReglaValidacionInvalidaException(
          'El formato regular solo aplica a validaciones de texto.',
        );
      }

      try {
        new RegExp(this.formatoRegex);
      } catch {
        throw new ReglaValidacionInvalidaException(
          'El formato regular de la validación no es válido.',
        );
      }
    }

    if (
      this.tipoDato === TipoDatoValidacion.SELECCION &&
      this.valoresPermitidos.length === 0
    ) {
      throw new ReglaValidacionInvalidaException(
        'Una validación de selección debe definir valores permitidos.',
      );
    }

    if (
      this.tipoDato !== TipoDatoValidacion.SELECCION &&
      this.valoresPermitidos.length > 0
    ) {
      throw new ReglaValidacionInvalidaException(
        'Los valores permitidos solo aplican a validaciones de selección.',
      );
    }

    if (this.mensajeError.trim().length === 0) {
      throw new ReglaValidacionInvalidaException(
        'La regla de validación debe definir un mensaje de error.',
      );
    }
  }
}
