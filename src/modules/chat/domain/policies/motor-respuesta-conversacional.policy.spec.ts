import {
  nodoRespuesta,
  reglaRespuesta,
  transicionRespuesta,
} from '../../application/support/testing/respuesta-fixtures';
import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../enums/tipo-dato-validacion-enum';
import { tipoEntradaConfigurado } from '../enums/tipo-entrada-respuesta.enum';
import { ReglaValidacionInvalidaException } from '../exceptions';
import {
  MotorRespuestaConversacional,
  ConfiguracionRespuestaInvalida,
  RespuestaUsuarioInvalida,
} from './motor-respuesta-conversacional.policy';

describe('RF-27/28/29 motor de respuestas', () => {
  const motor = new MotorRespuestaConversacional();
  const formato = (p: string, s: string) => new RegExp(p).test(s);
  const numerica = { tipo_entrada: 'NUMERICO', min: 0, max: 10 };
  const resolver = (
    valor: unknown,
    entrada: unknown = numerica,
    transiciones = [transicionRespuesta()],
  ) =>
    motor.resolver(
      nodoRespuesta(entrada),
      transiciones,
      valor,
      formato,
      tipoEntradaConfigurado(
        (entrada as { tipo?: unknown; tipo_entrada?: unknown } | null)?.tipo ??
          (entrada as { tipo_entrada?: unknown } | null)?.tipo_entrada,
      ) ?? 'CONTINUAR',
    );
  const igual = (
    valor: unknown,
    tipoDato = Dato.SELECCION,
    valoresPermitidos = tipoDato === Dato.SELECCION ? ['a', 'b', 'c'] : [],
    otros: Parameters<typeof reglaRespuesta>[0] = {},
  ) =>
    reglaRespuesta({
      tipoDato,
      valoresPermitidos,
      operadorCondicion: Op.IGUALDAD,
      valorEsperado: { valor },
      ...otros,
    });
  const errorDe = (fn: () => unknown): unknown => {
    try {
      fn();
    } catch (error: unknown) {
      return error;
    }
    throw new Error('Debía lanzar.');
  };

  describe('captura básica definida por la entrada del nodo', () => {
    it.each([0, 5, 10])('acepta numérico %s sin alterarlo', (valor) => {
      expect(resolver(valor).respuesta).toBe(valor);
    });

    it.each([-1, 11])('rechaza %s fuera del rango del nodo', (valor) => {
      expect(errorDe(() => resolver(valor))).toMatchObject({
        message: 'El valor ingresado está fuera del rango permitido.',
        codigo: 'FUERA_DE_RANGO',
      });
    });

    it.each(['5', true, {}, [5], Infinity, NaN])(
      'rechaza tipo numérico incorrecto: %p',
      (valor) => {
        expect(() => resolver(valor)).toThrow(RespuestaUsuarioInvalida);
      },
    );

    it('rechaza ausencia del campo respuesta', () =>
      expect(() => resolver(undefined)).toThrow(RespuestaUsuarioInvalida));

    it('multiselección conserva el arreglo y su orden', () => {
      expect(
        resolver(['b', 'a'], { tipo_entrada: 'SELECCION_MULTIPLE' }, [
          transicionRespuesta(igual(['a', 'b'])),
        ]).respuesta,
      ).toEqual(['b', 'a']);
    });

    it.each([['a', 'a'], ['c'], [1], 'a'])(
      'rechaza multiselección inválida o sin camino %p',
      (valor) => {
        expect(() =>
          resolver(valor, { tipo_entrada: 'SELECCION_MULTIPLE' }, [
            transicionRespuesta(igual(['a'])),
          ]),
        ).toThrow(RespuestaUsuarioInvalida);
      },
    );

    it('no acepta texto como booleano', () =>
      expect(() => resolver('false', { tipo_entrada: 'BOOLEANO' })).toThrow());

    it('respeta límites de fecha y hora declarados por el nodo', () => {
      const t = transicionRespuesta(igual('2026-11-05', Dato.FECHA));
      expect(() =>
        resolver(
          '2026-11-05',
          { tipo_entrada: 'FECHA_HORA', formato: 'FECHA', min: '2026-11-06' },
          [t],
        ),
      ).toThrow(RespuestaUsuarioInvalida);
      expect(
        resolver(
          '2026-11-05',
          {
            tipo_entrada: 'FECHA_HORA',
            formato: 'FECHA',
            min: '2026-11-05',
            max: '2026-11-05',
          },
          [t],
        ).respuesta,
      ).toBe('2026-11-05');
    });

    it('rechaza límites invertidos y de fecha mal configurados', () => {
      expect(() =>
        resolver(5, { tipo_entrada: 'NUMERICO', min: 8, max: 2 }),
      ).toThrow(ConfiguracionRespuestaInvalida);
      expect(() =>
        resolver('2026-11-05', { tipo_entrada: 'FECHA_HORA', min: 'ayer' }),
      ).toThrow(ConfiguracionRespuestaInvalida);
    });

    it.each(['2025-02-29', '2026-02-30', 'hoy', '2026-11-05T25:00:00Z'])(
      'rechaza fecha imposible %s',
      (valor) => {
        expect(() => resolver(valor, { tipo_entrada: 'FECHA_HORA' })).toThrow(
          RespuestaUsuarioInvalida,
        );
      },
    );

    it('no infiere texto libre en una pregunta sin entrada', () =>
      expect(() => resolver('texto', {})).toThrow(
        ConfiguracionRespuestaInvalida,
      ));

    it('rechaza el tipo declarado por el cliente si no es el del nodo', () => {
      expect(() =>
        motor.resolver(
          nodoRespuesta(numerica),
          [transicionRespuesta()],
          5,
          formato,
          'TEXTO_LIBRE',
        ),
      ).toThrow(RespuestaUsuarioInvalida);
    });

    it('respeta paso numérico y precisión; la escala avanza de 1 en 1 (RF-25)', () => {
      expect(
        resolver(4, { tipo_entrada: 'NUMERICO', min: 0, max: 10, paso: 2 })
          .respuesta,
      ).toBe(4);
      expect(() =>
        resolver(3, { tipo_entrada: 'NUMERICO', min: 0, max: 10, paso: 2 }),
      ).toThrow();
      // En ESCALA el paso configurado se ignora: 3 es válido, 2.5 no.
      expect(
        resolver(3, { tipo_entrada: 'ESCALA', min: 0, max: 10, paso: 2 })
          .respuesta,
      ).toBe(3);
      expect(() =>
        resolver(2.5, { tipo_entrada: 'ESCALA', min: 0, max: 10 }),
      ).toThrow();
      expect(() =>
        resolver(2.5, { tipo_entrada: 'NUMERICO', decimales: 0 }),
      ).toThrow();
    });

    it('comprueba restricciones de selección, palabras y opciones', () => {
      expect(() =>
        resolver(['a'], {
          tipo_entrada: 'SELECCION_MULTIPLE',
          min_selecciones: 2,
        }),
      ).toThrow();
      expect(() =>
        resolver('a', { tipo_entrada: 'TEXTO_LIBRE', min_palabras: 2 }),
      ).toThrow();
      expect(() =>
        resolver('b', {
          tipo_entrada: 'SELECCION_UNICA',
          opciones: [{ valor: 'a' }],
        }),
      ).toThrow();
    });

    it('maxCaracteres restringe texto sin recortarlo', () => {
      const t = transicionRespuesta(igual('dos', Dato.TEXTO));
      expect(() =>
        resolver('cuatro', { tipo: 'TEXTO_LIBRE', maxCaracteres: 4 }, [t]),
      ).toThrow(RespuestaUsuarioInvalida);
      expect(
        resolver('dos', { tipo: 'TEXTO_LIBRE', maxCaracteres: 4 }, [t])
          .respuesta,
      ).toBe('dos');
    });

    it.each(['OPCION_UNICA', 'SELECCION_UNICA'])(
      'lee configuración %s y exige el literal público OPCION_UNICA',
      (tipo) => {
        const t = transicionRespuesta(igual('a', Dato.TEXTO));
        expect(
          motor.resolver(
            nodoRespuesta({ tipo }),
            [t],
            'a',
            formato,
            'OPCION_UNICA',
          ).tipoEntrada,
        ).toBe('OPCION_UNICA');
        expect(() =>
          motor.resolver(
            nodoRespuesta({ tipo }),
            [t],
            'a',
            formato,
            'SELECCION_UNICA',
          ),
        ).toThrow(RespuestaUsuarioInvalida);
      },
    );
  });

  describe('elección de transición por su regla', () => {
    it.each(['a', 'b'])('selección única %s va por su transición', (valor) => {
      const a = transicionRespuesta(igual('a', Dato.TEXTO), 1, 'destino-a');
      const b = transicionRespuesta(igual('b', Dato.TEXTO), 2, 'destino-b');
      expect(
        resolver(valor, { tipo_entrada: 'SELECCION_UNICA' }, [a, b])
          .idNodoDestino,
      ).toBe(`destino-${valor}`);
    });

    it.each([true, false])('Sí/No %s va por su transición', (valor) => {
      const reglaSiNo = (v: boolean) =>
        igual(v, Dato.SELECCION, ['true', 'false']);
      const si = transicionRespuesta(reglaSiNo(true), 1, 'destino-true');
      const no = transicionRespuesta(reglaSiNo(false), 2, 'destino-false');
      expect(
        resolver(valor, { tipo_entrada: 'BOOLEANO' }, [si, no]).idNodoDestino,
      ).toBe(`destino-${valor}`);
    });

    it('toma la primera regla que se cumple por orden, sin cambiar el arreglo', () => {
      const primera = transicionRespuesta(
        reglaRespuesta({ valorEsperado: { min: 0, max: 6 } }),
        1,
      );
      const segunda = transicionRespuesta(
        reglaRespuesta({ valorEsperado: { min: 0, max: 10 } }),
        2,
      );
      const lista = [segunda, primera];
      expect(resolver(5, undefined, lista).idRegla).toBe(primera.idTransicion);
      expect(lista).toEqual([segunda, primera]);
    });

    it('número por igualdad', () => {
      const t = transicionRespuesta(igual(7, Dato.NUMERICO));
      expect(resolver(7, undefined, [t]).idRegla).toBe(t.idTransicion);
    });

    it('conserva null opcional cuando la regla lo espera', () => {
      expect(
        resolver(null, numerica, [
          transicionRespuesta(
            igual(null, Dato.NUMERICO, [], { obligatorio: false }),
          ),
        ]).respuesta,
      ).toBeNull();
    });

    it('valida el formato de texto como parte de la regla', () => {
      const t = transicionRespuesta(
        igual('ABC', Dato.TEXTO, [], { formatoRegex: '^[A-Z]{3}$' }),
      );
      expect(
        resolver('ABC', { tipo_entrada: 'TEXTO_LIBRE' }, [t]).respuesta,
      ).toBe('ABC');
      expect(() =>
        resolver('abc', { tipo_entrada: 'TEXTO_LIBRE' }, [t]),
      ).toThrow('Revise su respuesta.');
    });
  });

  describe('cuando ninguna regla se cumple', () => {
    it('no avanza y devuelve el mensaje de error de la primera transición', () => {
      const primera = transicionRespuesta(
        igual(9, Dato.NUMERICO, [], { mensajeError: 'Elige otro número.' }),
        1,
      );
      const segunda = transicionRespuesta(
        igual(8, Dato.NUMERICO, [], { mensajeError: 'Mensaje de la segunda.' }),
        2,
      );
      expect(
        errorDe(() => resolver(5, undefined, [segunda, primera])),
      ).toMatchObject({
        message: 'Elige otro número.',
        codigo: 'SIN_COINCIDENCIA',
      });
    });

    it('una respuesta Sí/No no coincide con el texto "false"', () => {
      expect(() =>
        resolver(false, { tipo_entrada: 'BOOLEANO' }, [
          transicionRespuesta(
            igual('false', Dato.SELECCION, ['true', 'false']),
          ),
        ]),
      ).toThrow(RespuestaUsuarioInvalida);
    });

    it('una respuesta obligatoria vacía tiene prioridad', () => {
      for (const [valor, entrada] of [
        ['', { tipo: 'OPCION_UNICA', opciones: ['a'] }],
        [[], { tipo: 'MULTISELECCION', min_selecciones: 2 }],
      ] as const) {
        expect(
          errorDe(() =>
            motor.resolver(
              nodoRespuesta(entrada),
              [transicionRespuesta(igual('a'))],
              valor,
              formato,
              entrada.tipo,
            ),
          ),
        ).toMatchObject({ codigo: 'RESPUESTA_OBLIGATORIA' });
      }
    });
  });

  describe('configuración', () => {
    it.each([
      [Op.IGUALDAD, {}],
      [Op.RANGO, { min: 5, max: 1 }],
      [Op.RANGO, { min: '0', max: 3 }],
    ])(
      'la regla rechaza un valor esperado mal configurado (%s %p)',
      (op, valor) => {
        expect(() =>
          reglaRespuesta({ operadorCondicion: op, valorEsperado: valor }),
        ).toThrow(ReglaValidacionInvalidaException);
      },
    );

    it('una transición sin regla en un nodo con respuesta es error de configuración', () => {
      expect(() => resolver(5, undefined, [transicionRespuesta(null)])).toThrow(
        ConfiguracionRespuestaInvalida,
      );
    });

    it('no permite órdenes duplicados ni transiciones de otro flujo', () => {
      const t = transicionRespuesta();
      expect(() => resolver(5, undefined, [t, t])).toThrow(
        ConfiguracionRespuestaInvalida,
      );
      expect(() =>
        motor.resolver(
          nodoRespuesta(numerica).copiarEn('otro', 'actor'),
          [t],
          5,
          formato,
          'NUMERICO',
        ),
      ).toThrow(ConfiguracionRespuestaInvalida);
    });

    it('un nodo sin salidas rechaza respuestas con NODO_TERMINAL', () => {
      for (const nodo of [nodoRespuesta(), nodoRespuesta(null, 'MENSAJE')]) {
        expect(
          errorDe(() => motor.resolver(nodo, [], null, formato, 'CONTINUAR')),
        ).toMatchObject({ codigo: 'NODO_TERMINAL' });
      }
    });

    it('un nodo sin respuesta y sin transiciones avanza al destino implícito (RF-25)', () => {
      const decision = motor.resolver(
        nodoRespuesta(null, 'MENSAJE'),
        [],
        null,
        formato,
        'CONTINUAR',
        undefined,
        'siguiente-por-orden',
      );
      expect(decision).toMatchObject({
        idNodoDestino: 'siguiente-por-orden',
        idRegla: null,
        tipoEntrada: 'CONTINUAR',
      });
    });

    it('el destino implícito no aplica a nodos que esperan respuesta', () => {
      expect(
        errorDe(() =>
          motor.resolver(
            nodoRespuesta(numerica),
            [],
            5,
            formato,
            'NUMERICO',
            undefined,
            'siguiente-por-orden',
          ),
        ),
      ).toMatchObject({ codigo: 'NODO_TERMINAL' });
    });

    it('la regla SIEMPRE coincide con cualquier respuesta y queda como respaldo', () => {
      const especifica = transicionRespuesta(
        reglaRespuesta({
          operadorCondicion: Op.IGUALDAD,
          valorEsperado: { valor: 7 },
        }),
        1,
        'destino-7',
      );
      const porDefecto = transicionRespuesta(
        reglaRespuesta({
          operadorCondicion: Op.SIEMPRE,
          valorEsperado: {},
        }),
        2,
        'destino-otro',
      );
      expect(
        resolver(7, numerica, [porDefecto, especifica]).idNodoDestino,
      ).toBe('destino-7');
      expect(
        resolver(3, numerica, [porDefecto, especifica]).idNodoDestino,
      ).toBe('destino-otro');
    });

    it('un nodo sin respuesta (CONTINUAR) avanza por su primera transición, sin regla', () => {
      const primera = transicionRespuesta(null, 1, 'destino-1');
      const segunda = transicionRespuesta(null, 2, 'destino-2');
      expect(
        motor.resolver(
          nodoRespuesta(null, 'MENSAJE'),
          [segunda, primera],
          null,
          formato,
          'CONTINUAR',
        ).idNodoDestino,
      ).toBe('destino-1');
    });
  });
});
