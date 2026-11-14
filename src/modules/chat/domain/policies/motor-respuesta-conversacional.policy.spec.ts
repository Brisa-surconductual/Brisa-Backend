import {
  nodoRespuesta,
  reglaRespuesta,
  transicionRespuesta,
} from '../../application/support/testing/respuesta-fixtures';
import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../enums/tipo-dato-validacion-enum';
import { tipoEntradaConfigurado } from '../enums/tipo-entrada-respuesta.enum';
import {
  MotorRespuestaConversacional,
  ConfiguracionRespuestaInvalida,
  RespuestaUsuarioInvalida,
} from './motor-respuesta-conversacional.policy';

describe('RF-27/28/29 motor de respuestas', () => {
  const motor = new MotorRespuestaConversacional();
  const formato = (p: string, s: string) => new RegExp(p).test(s);
  const resolver = (
    valor: unknown,
    entrada: unknown = { tipo_entrada: 'NUMERICO' },
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
  const seleccion = () =>
    reglaRespuesta({
      tipoDato: Dato.SELECCION,
      valoresPermitidos: ['a', 'b', 'true', 'false'],
    });

  it.each([0, 5, 10])(
    'acepta numérico %s sin convertirlo ni alterarlo',
    (valor) => {
      expect(resolver(valor).respuesta).toBe(valor);
    },
  );
  it.each([-1, 11])(
    'rechaza %s fuera del rango con el mensaje del contrato',
    (valor) => {
      expect(() => resolver(valor)).toThrow(
        'El valor ingresado está fuera del rango permitido.',
      );
      try {
        resolver(valor);
      } catch (e) {
        expect(e).toMatchObject({ codigo: 'FUERA_DE_RANGO' });
      }
    },
  );
  it.each(['5', true, {}, [5], Infinity, NaN])(
    'rechaza tipo numérico incorrecto: %p',
    (valor) => {
      expect(() => resolver(valor)).toThrow(RespuestaUsuarioInvalida);
    },
  );
  it('rechaza ausencia del campo respuesta', () =>
    expect(() => resolver(undefined)).toThrow(RespuestaUsuarioInvalida));
  it('rechaza null obligatorio con código específico', () => {
    try {
      resolver(null);
    } catch (e) {
      expect(e).toMatchObject({ codigo: 'RESPUESTA_OBLIGATORIA' });
    }
  });
  it('conserva null opcional sin convertirlo en string', () => {
    expect(
      resolver(null, { tipo_entrada: 'NUMERICO' }, [
        transicionRespuesta(
          { valor: null },
          Op.IGUALDAD,
          reglaRespuesta({ obligatorio: false }),
        ),
      ]).respuesta,
    ).toBeNull();
  });
  it.each(['a', 'b'])('acepta selección %s definida por la regla', (valor) => {
    expect(
      resolver(valor, { tipo_entrada: 'SELECCION_UNICA' }, [
        transicionRespuesta({ valores: ['a', 'b'] }, Op.CATEGORIA, seleccion()),
      ]).respuesta,
    ).toBe(valor);
  });
  it('rechaza opción fuera del catálogo permitido', () => {
    expect(() =>
      resolver('c', { tipo_entrada: 'SELECCION_UNICA' }, [
        transicionRespuesta({ valor: 'c' }, Op.IGUALDAD, seleccion()),
      ]),
    ).toThrow(RespuestaUsuarioInvalida);
  });
  it('multiselección conserva el arreglo y su orden', () => {
    expect(
      resolver(['b', 'a'], { tipo_entrada: 'SELECCION_MULTIPLE' }, [
        transicionRespuesta({ valores: ['a'] }, Op.CATEGORIA, seleccion()),
      ]).respuesta,
    ).toEqual(['b', 'a']);
  });
  it.each([['a', 'a'], ['c'], [1], 'a'])(
    'rechaza multiselección inválida %p',
    (valor) => {
      expect(() =>
        resolver(valor, { tipo_entrada: 'SELECCION_MULTIPLE' }, [
          transicionRespuesta({ valores: ['a'] }, Op.CATEGORIA, seleccion()),
        ]),
      ).toThrow(RespuestaUsuarioInvalida);
    },
  );
  it('multiselección vacía obligatoria no avanza', () => {
    expect(() =>
      resolver([], { tipo_entrada: 'SELECCION_MULTIPLE' }, [
        transicionRespuesta({ valores: ['a'] }, Op.CATEGORIA, seleccion()),
      ]),
    ).toThrow(RespuestaUsuarioInvalida);
  });
  it.each([false, true])('acepta booleano %s sin coerción', (valor) => {
    expect(
      resolver(valor, { tipo_entrada: 'BOOLEANO' }, [
        transicionRespuesta({ valor }, Op.IGUALDAD, seleccion()),
      ]).respuesta,
    ).toBe(valor);
  });
  it('no acepta texto como booleano', () =>
    expect(() => resolver('false', { tipo_entrada: 'BOOLEANO' })).toThrow());
  it('respeta límites de fecha y hora declarados por el nodo', () => {
    const t = transicionRespuesta(
      { valor: '2026-11-05' },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.FECHA }),
    );
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
    expect(() =>
      resolver(
        '10:30',
        { tipo_entrada: 'FECHA_HORA', formato: 'HORA', max: '10:00' },
        [t],
      ),
    ).toThrow(RespuestaUsuarioInvalida);
  });
  it('rechaza límites invertidos y de fecha mal configurados', () => {
    expect(() =>
      resolver(5, { tipo_entrada: 'NUMERICO', min: 8, max: 2 }),
    ).toThrow(ConfiguracionRespuestaInvalida);
    expect(() =>
      resolver('2026-11-05', { tipo_entrada: 'FECHA_HORA', min: 'ayer' }),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
  it.each([
    ['2024-02-29', 'FECHA'],
    ['12:30', 'HORA'],
    ['23:59:59', 'HORA'],
    ['2026-11-05T12:30:00-05:00', 'FECHA_HORA'],
  ])('acepta fecha/hora válida %s', (valor, fechaFormato) => {
    expect(
      resolver(valor, { tipo_entrada: 'FECHA_HORA', formato: fechaFormato }, [
        transicionRespuesta(
          { valor },
          Op.IGUALDAD,
          reglaRespuesta({ tipoDato: Dato.FECHA }),
        ),
      ]).respuesta,
    ).toBe(valor);
  });
  it.each([
    '2025-02-29',
    '2026-02-30',
    '2026-13-01',
    'hoy',
    '2026-11-05T25:00:00Z',
  ])('rechaza fecha imposible %s', (valor) => {
    expect(() => resolver(valor, { tipo_entrada: 'FECHA_HORA' })).toThrow(
      RespuestaUsuarioInvalida,
    );
  });
  it('valida regex únicamente en texto explícitamente habilitado', () => {
    const t = transicionRespuesta(
      { valor: 'ABC' },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.TEXTO, formatoRegex: '^[A-Z]{3}$' }),
    );
    expect(
      resolver('ABC', { tipo_entrada: 'TEXTO_LIBRE' }, [t]).respuesta,
    ).toBe('ABC');
    expect(() => resolver('abc', { tipo_entrada: 'TEXTO_LIBRE' }, [t])).toThrow(
      'Revise su respuesta.',
    );
  });
  it('no infiere texto libre en una pregunta sin entrada', () =>
    expect(() => resolver('texto', {})).toThrow(
      ConfiguracionRespuestaInvalida,
    ));
  it('rechaza el tipo declarado por el cliente si no es el del nodo', () => {
    expect(() =>
      motor.resolver(
        nodoRespuesta(),
        [transicionRespuesta()],
        5,
        formato,
        'TEXTO_LIBRE',
      ),
    ).toThrow(RespuestaUsuarioInvalida);
  });
  it('respeta paso de escala y precisión numérica', () => {
    expect(
      resolver(4, { tipo_entrada: 'ESCALA', min: 0, max: 10, paso: 2 })
        .respuesta,
    ).toBe(4);
    expect(() => resolver(3, { tipo_entrada: 'ESCALA', paso: 2 })).toThrow();
    expect(() =>
      resolver(2.5, { tipo_entrada: 'NUMERICO', decimales: 0 }),
    ).toThrow();
  });
  it('comprueba restricciones de selección, palabras y opciones declaradas', () => {
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
  it('selecciona una única transición por orden_evaluacion, sin cambiar el arreglo', () => {
    const primera = transicionRespuesta(
      { min: 0, max: 6 },
      Op.RANGO,
      reglaRespuesta(),
      1,
    );
    const segunda = transicionRespuesta(
      { min: 0, max: 10 },
      Op.RANGO,
      reglaRespuesta(),
      2,
    );
    const lista = [segunda, primera];
    expect(resolver(5, undefined, lista).idRegla).toBe(primera.idTransicion);
    expect(lista).toEqual([segunda, primera]);
  });
  it('evalúa reglas de validación por ruta sin exigir opciones de otra rama', () => {
    const a = transicionRespuesta(
      { valor: 'a' },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.SELECCION, valoresPermitidos: ['a'] }),
      1,
    );
    const b = transicionRespuesta(
      { valor: 'b' },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.SELECCION, valoresPermitidos: ['b'] }),
      2,
    );
    expect(
      resolver('b', { tipo_entrada: 'SELECCION_UNICA' }, [a, b]).idRegla,
    ).toBe(b.idTransicion);
  });
  it('distingue una respuesta válida sin ruta de una respuesta inválida', () => {
    expect(() =>
      resolver(5, undefined, [
        transicionRespuesta({ valor: 9 }, Op.IGUALDAD, reglaRespuesta()),
      ]),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
  it('no acepta una condición booleana por igualdad con string', () => {
    expect(() =>
      resolver(false, { tipo_entrada: 'BOOLEANO' }, [
        transicionRespuesta({ valor: 'false' }, Op.IGUALDAD, seleccion()),
      ]),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
  it.each([
    [{}, Op.IGUALDAD],
    [{ min: 5, max: 1 }, Op.RANGO],
    [{ min: '0' }, Op.RANGO],
    [{ valores: [] }, Op.CATEGORIA],
  ])('rechaza condición mal configurada %p', (condicion, operador) => {
    expect(() =>
      resolver(5, undefined, [transicionRespuesta(condicion, operador)]),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
  it('no permite órdenes duplicados ni transiciones de otro flujo', () => {
    const t = transicionRespuesta();
    expect(() => resolver(5, undefined, [t, t])).toThrow(
      ConfiguracionRespuestaInvalida,
    );
    expect(() =>
      motor.resolver(
        nodoRespuesta().copiarEn('otro', 'actor'),
        [t],
        5,
        formato,
        'NUMERICO',
      ),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
  it('un nodo sin salidas rechaza respuestas con NODO_TERMINAL', () => {
    for (const nodo of [nodoRespuesta(), nodoRespuesta(null, 'MENSAJE')]) {
      try {
        motor.resolver(nodo, [], null, formato, 'CONTINUAR');
        fail('Debe rechazar');
      } catch (error) {
        expect(error).toMatchObject({ codigo: 'NODO_TERMINAL' });
      }
    }
  });
  it('un mensaje intermedio avanza solo con condición explícita y null permitido', () => {
    const t = transicionRespuesta(
      { valor: null },
      Op.IGUALDAD,
      reglaRespuesta({ obligatorio: false }),
    );
    expect(
      motor.resolver(
        nodoRespuesta(null, 'MENSAJE'),
        [t],
        null,
        formato,
        'CONTINUAR',
      ).idRegla,
    ).toBe(t.idTransicion);
  });
  it('permite texto libre válido mediante una condición explícita de validez', () => {
    const t = transicionRespuesta(
      { campo: 'es_valida', valor: true },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.TEXTO, formatoRegex: '^.{3,}$' }),
    );
    expect(
      resolver('Una respuesta nueva', { tipo: 'TEXTO_LIBRE' }, [t]).idRegla,
    ).toBe(t.idTransicion);
    expect(() => resolver('ab', { tipo: 'TEXTO_LIBRE' }, [t])).toThrow(
      RespuestaUsuarioInvalida,
    );
  });
  it.each(['OPCION_UNICA', 'SELECCION_UNICA'])(
    'lee configuración %s y exige el literal público OPCION_UNICA',
    (tipo) => {
      const t = transicionRespuesta({ valor: 'a' }, Op.IGUALDAD, seleccion());
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
  it('maxCaracteres restringe texto sin recortarlo', () => {
    const t = transicionRespuesta(
      { campo: 'es_valida', valor: true },
      Op.IGUALDAD,
      reglaRespuesta({ tipoDato: Dato.TEXTO }),
    );
    expect(() =>
      resolver('cuatro', { tipo: 'TEXTO_LIBRE', maxCaracteres: 4 }, [t]),
    ).toThrow(RespuestaUsuarioInvalida);
    expect(
      resolver('dos', { tipo: 'TEXTO_LIBRE', maxCaracteres: 4 }, [t]).respuesta,
    ).toBe('dos');
  });
  it.each([
    ['', { tipo: 'OPCION_UNICA', opciones: ['a'] }, Dato.SELECCION, ['a']],
    [[], { tipo: 'MULTISELECCION', min_selecciones: 2 }, Dato.SELECCION, ['a']],
    ['', { tipo: 'FECHA_HORA' }, Dato.FECHA, []],
  ] as const)(
    'la ausencia obligatoria %p tiene prioridad sobre formato, opciones o rango',
    (valor, entrada, tipoDato, permitidos) => {
      const t = transicionRespuesta(
        { campo: 'es_valida', valor: true },
        Op.IGUALDAD,
        reglaRespuesta({
          tipoDato,
          obligatorio: true,
          valoresPermitidos: [...permitidos],
        }),
      );
      let error: unknown;
      try {
        motor.resolver(
          nodoRespuesta(entrada),
          [t],
          valor,
          formato,
          entrada.tipo,
        );
      } catch (capturado: unknown) {
        error = capturado;
      }
      expect(error).toMatchObject({ codigo: 'RESPUESTA_OBLIGATORIA' });
    },
  );
});
