import { reglaRespuesta } from '../../application/support/testing/respuesta-fixtures';
import { OperadorCondicion } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../enums/tipo-dato-validacion-enum';
import { RespuestaUsuarioInvalida } from '../exceptions/respuesta.exceptions';
import { ValidarRespuesta } from './validar-respuesta.policy';

describe('ValidarRespuesta · SELECCION para Sí/No (RF-25)', () => {
  const validar = new ValidarRespuesta();
  const reglaSiNo = reglaRespuesta({
    tipoDato: TipoDatoValidacion.SELECCION,
    valoresPermitidos: ['true', 'false'],
    operadorCondicion: OperadorCondicion.IGUALDAD,
    valorEsperado: { valor: true },
  });

  it('acepta los dos valores booleanos', () => {
    expect(() => validar.comprobar(true, reglaSiNo, () => true)).not.toThrow();
    expect(() => validar.comprobar(false, reglaSiNo, () => true)).not.toThrow();
  });

  it('rechaza un valor fuera de Sí/No', () => {
    expect(() => validar.comprobar('si', reglaSiNo, () => true)).toThrow(
      RespuestaUsuarioInvalida,
    );
  });
});
