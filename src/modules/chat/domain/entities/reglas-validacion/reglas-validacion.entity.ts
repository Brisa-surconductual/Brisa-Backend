import { randomUUID } from 'crypto';
import { OperadorCondicion } from '../../enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../enums/tipo-dato-validacion-enum';
import { ReglaValidacionInvalidaException } from '../../exceptions';

/**
 * RF-25: regla propia de una transición (1:1, nunca compartida). Además de
 * validar el dato, define cuándo se toma la transición: `operadorCondicion`
 * y `valorEsperado` (`{ valor }` en IGUALDAD, `{ min, max }` en RANGO, `{}` en
 * SIEMPRE, la transición por defecto).
 */
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
    readonly operadorCondicion: OperadorCondicion,
    readonly valorEsperado: unknown,
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
    operadorCondicion: OperadorCondicion,
    valorEsperado: unknown,
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
      operadorCondicion,
      valorEsperado,
    );
  }

  /** Mismos datos con otro identificador (cada transición copiada tiene la suya). */
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
      this.operadorCondicion,
      this.valorEsperado,
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

    this.validarValorEsperado();
  }

  private validarValorEsperado(): void {
    const esperado = this.valorEsperado;
    const esObjeto =
      typeof esperado === 'object' &&
      esperado !== null &&
      !Array.isArray(esperado);

    // RF-25: "cualquier otra respuesta" no compara nada.
    if (this.operadorCondicion === OperadorCondicion.SIEMPRE) {
      if (!esObjeto)
        throw new ReglaValidacionInvalidaException(
          'La transición por defecto no define valor esperado.',
        );
      return;
    }

    if (this.operadorCondicion === OperadorCondicion.IGUALDAD) {
      if (!esObjeto || !Object.hasOwn(esperado, 'valor')) {
        throw new ReglaValidacionInvalidaException(
          'La igualdad debe definir el valor esperado de la respuesta.',
        );
      }
      return;
    }

    const { min, max } = (esObjeto ? esperado : {}) as {
      min?: unknown;
      max?: unknown;
    };
    if (
      typeof min !== 'number' ||
      typeof max !== 'number' ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min > max
    ) {
      throw new ReglaValidacionInvalidaException(
        'El rango debe definir un mínimo y un máximo coherentes.',
      );
    }
  }
}
