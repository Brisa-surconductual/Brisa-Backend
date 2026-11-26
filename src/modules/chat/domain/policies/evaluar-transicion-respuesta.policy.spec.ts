import { reglaRespuesta } from '../../application/support/testing/respuesta-fixtures';
import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../enums/tipo-dato-validacion-enum';
import { EvaluarTransicionRespuesta } from './evaluar-transicion-respuesta.policy';

describe('EvaluarTransicionRespuesta.coincide (RF-29)', () => {
  const evaluador = new EvaluarTransicionRespuesta();
  const igualdad = (valor: unknown) =>
    reglaRespuesta({
      tipoDato: Dato.SELECCION,
      valoresPermitidos: ['a', 'b', 'c'],
      operadorCondicion: Op.IGUALDAD,
      valorEsperado: { valor },
    });

  it('IGUALDAD con listas compara como conjunto (selección múltiple)', () => {
    expect(evaluador.coincide(['b', 'a'], igualdad(['a', 'b']))).toBe(true);
    expect(evaluador.coincide(['a'], igualdad(['a', 'b']))).toBe(false);
    expect(evaluador.coincide(['a', 'c'], igualdad(['a', 'b']))).toBe(false);
    expect(evaluador.coincide(['a', 'b', 'c'], igualdad(['a', 'b']))).toBe(
      false,
    );
  });

  it('IGUALDAD con escalares es estricta', () => {
    expect(evaluador.coincide('a', igualdad('a'))).toBe(true);
    expect(evaluador.coincide('b', igualdad('a'))).toBe(false);
    expect(evaluador.coincide(true, igualdad(true))).toBe(true);
    expect(evaluador.coincide('true', igualdad(true))).toBe(false);
  });

  it('RANGO incluye los extremos y solo acepta números', () => {
    const rango = reglaRespuesta({
      operadorCondicion: Op.RANGO,
      valorEsperado: { min: 3, max: 7 },
    });
    expect(evaluador.coincide(3, rango)).toBe(true);
    expect(evaluador.coincide(7, rango)).toBe(true);
    expect(evaluador.coincide(8, rango)).toBe(false);
    expect(evaluador.coincide('5', rango)).toBe(false);
  });
});
