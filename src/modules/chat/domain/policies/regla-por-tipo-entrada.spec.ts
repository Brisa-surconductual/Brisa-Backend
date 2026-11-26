import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../enums/tipo-dato-validacion-enum';
import { ReglaValidacionInvalidaException } from '../exceptions';
import { construirReglaTransicion } from './regla-por-tipo-entrada';

const nodo = (entrada: Record<string, unknown> | null) =>
  entrada === null ? { texto: 'x' } : { texto: 'x', entrada };

const opciones = [
  { valor: 'a', etiqueta: 'A' },
  { valor: 'b', etiqueta: 'B' },
  { valor: 'c', etiqueta: 'C' },
];

const mensaje = 'Revisa tu respuesta.';

describe('construirReglaTransicion (RF-25, regla 1:1 por transición)', () => {
  describe('Selección única', () => {
    const entrada = { tipo: 'SELECCION_UNICA', opciones };

    it('arma IGUALDAD + TEXTO con la opción elegida', () => {
      const regla = construirReglaTransicion(nodo(entrada), {
        valorEsperado: { valor: 'b' },
        mensajeError: mensaje,
      });

      expect(regla).toMatchObject({
        operadorCondicion: Op.IGUALDAD,
        valorEsperado: { valor: 'b' },
        tipoDato: Dato.TEXTO,
        formatoRegex: null,
        valoresPermitidos: [],
        mensajeError: mensaje,
        obligatorio: true,
      });
    });

    it('rechaza una opción que el nodo no define', () => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          valorEsperado: { valor: 'z' },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('rechaza un operador distinto de IGUALDAD', () => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          operador: Op.RANGO,
          valorEsperado: { min: 1, max: 2 },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('toma `obligatorio` de la entrada del nodo', () => {
      const regla = construirReglaTransicion(
        nodo({ ...entrada, obligatorio: false }),
        { valorEsperado: { valor: 'a' }, mensajeError: mensaje },
      );
      expect(regla?.obligatorio).toBe(false);
    });
  });

  describe('Selección múltiple', () => {
    const entrada = {
      tipo: 'SELECCION_MULTIPLE',
      opciones,
      min_selecciones: 2,
      max_selecciones: 3,
    };

    it('arma IGUALDAD + SELECCION con las opciones del nodo como permitidas', () => {
      const regla = construirReglaTransicion(nodo(entrada), {
        valorEsperado: { valor: ['a', 'c'] },
        mensajeError: mensaje,
      });

      expect(regla).toMatchObject({
        operadorCondicion: Op.IGUALDAD,
        valorEsperado: { valor: ['a', 'c'] },
        tipoDato: Dato.SELECCION,
        valoresPermitidos: ['a', 'b', 'c'],
      });
    });

    it.each([[['a']], [['a', 'b', 'c', 'c']]])(
      'rechaza una cantidad fuera de min/max_selecciones: %p',
      (valor) => {
        expect(() =>
          construirReglaTransicion(nodo(entrada), {
            valorEsperado: { valor },
            mensajeError: mensaje,
          }),
        ).toThrow(ReglaValidacionInvalidaException);
      },
    );

    it('rechaza opciones que el nodo no define', () => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          valorEsperado: { valor: ['a', 'z'] },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('sin límites en el nodo acepta de 1 a todas las opciones', () => {
      const libre = { tipo: 'MULTISELECCION', opciones };
      expect(
        construirReglaTransicion(nodo(libre), {
          valorEsperado: { valor: ['a'] },
          mensajeError: mensaje,
        }),
      ).not.toBeNull();
      expect(() =>
        construirReglaTransicion(nodo(libre), {
          valorEsperado: { valor: [] },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });
  });

  describe('Escala numérica', () => {
    const entrada = { tipo: 'ESCALA', min: 1, max: 10, paso: 1 };

    it('arma RANGO + NUMERICO dentro del rango del nodo', () => {
      const regla = construirReglaTransicion(nodo(entrada), {
        valorEsperado: { min: 3, max: 7 },
        mensajeError: mensaje,
      });

      expect(regla).toMatchObject({
        operadorCondicion: Op.RANGO,
        valorEsperado: { min: 3, max: 7 },
        tipoDato: Dato.NUMERICO,
      });
    });

    it.each([
      [{ min: 0, max: 5 }],
      [{ min: 5, max: 11 }],
      [{ min: 7, max: 3 }],
      [{ min: 3 }],
    ])('rechaza un rango inválido o fuera del nodo: %p', (valorEsperado) => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          valorEsperado,
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('rechaza IGUALDAD', () => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          operador: Op.IGUALDAD,
          valorEsperado: { valor: 3 },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('exige que el nodo tenga mínimo y máximo', () => {
      expect(() =>
        construirReglaTransicion(nodo({ tipo: 'ESCALA' }), {
          valorEsperado: { min: 1, max: 2 },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });
  });

  describe('Número', () => {
    const entrada = { tipo: 'NUMERICO', min: 0, max: 20, paso: 5 };

    it('IGUALDAD acepta un valor del nodo alineado al paso', () => {
      const regla = construirReglaTransicion(nodo(entrada), {
        operador: Op.IGUALDAD,
        valorEsperado: { valor: 15 },
        mensajeError: mensaje,
      });

      expect(regla).toMatchObject({
        operadorCondicion: Op.IGUALDAD,
        valorEsperado: { valor: 15 },
        tipoDato: Dato.NUMERICO,
      });
    });

    it.each([7, 25, -5, '5'])(
      'IGUALDAD rechaza %p (fuera de rango, fuera del paso o no numérico)',
      (valor) => {
        expect(() =>
          construirReglaTransicion(nodo(entrada), {
            operador: Op.IGUALDAD,
            valorEsperado: { valor },
            mensajeError: mensaje,
          }),
        ).toThrow(ReglaValidacionInvalidaException);
      },
    );

    it('RANGO acepta límites dentro del rango del nodo', () => {
      expect(
        construirReglaTransicion(nodo(entrada), {
          operador: Op.RANGO,
          valorEsperado: { min: 5, max: 10 },
          mensajeError: mensaje,
        }),
      ).toMatchObject({ operadorCondicion: Op.RANGO });
    });

    it('exige elegir el operador', () => {
      expect(() =>
        construirReglaTransicion(nodo(entrada), {
          valorEsperado: { valor: 5 },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });

    it('sin paso en el nodo, IGUALDAD usa enteros desde el mínimo', () => {
      const sinPaso = { tipo: 'NUMERICO', min: 1, max: 5 };
      expect(
        construirReglaTransicion(nodo(sinPaso), {
          operador: Op.IGUALDAD,
          valorEsperado: { valor: 3 },
          mensajeError: mensaje,
        }),
      ).not.toBeNull();
      expect(() =>
        construirReglaTransicion(nodo(sinPaso), {
          operador: Op.IGUALDAD,
          valorEsperado: { valor: 2.5 },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });
  });

  describe('Sí/No', () => {
    it.each([true, false])('arma IGUALDAD + SELECCION con %p', (valor) => {
      const regla = construirReglaTransicion(nodo({ tipo: 'BOOLEANO' }), {
        valorEsperado: { valor },
        mensajeError: mensaje,
      });

      expect(regla).toMatchObject({
        operadorCondicion: Op.IGUALDAD,
        valorEsperado: { valor },
        tipoDato: Dato.SELECCION,
        valoresPermitidos: ['true', 'false'],
      });
    });

    it('rechaza un valor que no sea booleano', () => {
      expect(() =>
        construirReglaTransicion(nodo({ tipo: 'BOOLEANO' }), {
          valorEsperado: { valor: 'true' },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });
  });

  describe('Continuar', () => {
    it('sin entrada no lleva regla', () => {
      expect(construirReglaTransicion(nodo(null), undefined)).toBeNull();
    });

    it('rechaza que se le envíe una regla', () => {
      expect(() =>
        construirReglaTransicion(nodo(null), {
          valorEsperado: { valor: 'a' },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    });
  });

  it.each(['TEXTO_LIBRE', 'FECHA_HORA'])(
    'rechaza crear transiciones desde un nodo %s',
    (tipo) => {
      expect(() =>
        construirReglaTransicion(nodo({ tipo }), {
          valorEsperado: { valor: 'x' },
          mensajeError: mensaje,
        }),
      ).toThrow(ReglaValidacionInvalidaException);
    },
  );

  it('exige la regla en un nodo que espera respuesta', () => {
    expect(() =>
      construirReglaTransicion(
        nodo({ tipo: 'SELECCION_UNICA', opciones }),
        undefined,
      ),
    ).toThrow(ReglaValidacionInvalidaException);
  });

  it('exige un mensaje de error', () => {
    expect(() =>
      construirReglaTransicion(nodo({ tipo: 'BOOLEANO' }), {
        valorEsperado: { valor: true },
        mensajeError: '   ',
      }),
    ).toThrow(ReglaValidacionInvalidaException);
  });
});
