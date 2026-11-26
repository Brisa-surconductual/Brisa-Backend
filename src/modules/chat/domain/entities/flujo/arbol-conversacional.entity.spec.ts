import { OperadorCondicion } from '../../enums/operador-condicional.enum';
import { DimensionPerfilClinico as Dimension } from '../../enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../enums/tipo-dato-validacion-enum';
import { ReglaValidacion } from '../reglas-validacion/reglas-validacion.entity';
import { ArbolConversacional } from './arbol-conversacional.entity';
import { FlujoConversacional } from './flujo-conversacional.entity';
import { NodoConversacional } from './nodo-conversacional.entity';
import { TransicionConversacional } from './transicion-conversacional.entity';
import { EstadoFlujoConversacional } from '../../enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';

const fecha = new Date('2026-10-01T12:00:00.000Z');

function flujoGrupal(): FlujoConversacional {
  return new FlujoConversacional(
    'flujo-1',
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    EstadoFlujoConversacional.BORRADOR,
    1,
    'actor-1',
    fecha,
    null,
  );
}

function nodoSimple(idNodo: string): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    'flujo-1',
    'tipo-1',
    'MENSAJE',
    { texto: 'Hola' },
    false,
    1,
    null,
    'actor-1',
    fecha,
    fecha,
  );
}

function nodoCaptura(idNodo: string, dimension: Dimension): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    'flujo-1',
    'tipo-1',
    'PREGUNTA',
    {
      texto: 'Pregunta clínica',
      capturaPerfil: { dimension },
      entrada: {
        tipo: 'OPCION_UNICA',
        opciones:
          dimension === Dimension.TIPO_DEPENDENCIA
            ? ['ABSTINENCIA_FISICA', 'TOLERANCIA']
            : ['POSITIVO', 'NEGATIVO'],
      },
    },
    false,
    1,
    null,
    'actor-1',
    fecha,
    fecha,
  );
}

function nodoConEntrada(
  idNodo: string,
  entrada: Record<string, unknown>,
): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    'flujo-1',
    'tipo-1',
    'PREGUNTA',
    { texto: `Pregunta ${idNodo}`, entrada },
    false,
    2,
    null,
    'actor-1',
    fecha,
    fecha,
  );
}

function salida(
  idTransicion: string,
  origen: string,
  valor: unknown,
  orden: number,
): TransicionConversacional {
  return new TransicionConversacional(
    idTransicion,
    'flujo-1',
    origen,
    'fin',
    orden,
    new ReglaValidacion(
      `regla-${idTransicion}`,
      TipoDatoValidacion.SELECCION,
      true,
      null,
      null,
      null,
      ['a', 'b', 'c', 'true', 'false'],
      'Revisa tu respuesta.',
      OperadorCondicion.IGUALDAD,
      { valor },
    ),
    fecha,
  );
}

describe('ArbolConversacional.diagnosticarCobertura (RF-25)', () => {
  const opciones = [
    { valor: 'a', etiqueta: 'A' },
    { valor: 'b', etiqueta: 'B' },
    { valor: 'c', etiqueta: 'C' },
  ];

  it('reporta las opciones de selección única que no tienen transición', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoConEntrada('n1', { tipo: 'SELECCION_UNICA', opciones })],
      [salida('t1', 'n1', 'a', 1)],
    );

    expect(arbol.diagnosticarCobertura()).toEqual({
      nodos_sin_cobertura: [
        {
          id_nodo: 'n1',
          orden: 2,
          texto: 'Pregunta n1',
          valores_faltantes: ['b', 'c'],
        },
      ],
    });
  });

  it('reporta el lado de Sí/No que no tiene transición', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoConEntrada('n1', { tipo: 'BOOLEANO' })],
      [salida('t1', 'n1', true, 1)],
    );

    expect(arbol.diagnosticarCobertura().nodos_sin_cobertura).toEqual([
      expect.objectContaining({ id_nodo: 'n1', valores_faltantes: ['false'] }),
    ]);
  });

  it('no reporta nada si cada opción tiene su camino', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoConEntrada('n1', { tipo: 'SELECCION_UNICA', opciones }),
        nodoConEntrada('n2', { tipo: 'BOOLEANO' }),
      ],
      [
        salida('t1', 'n1', 'a', 1),
        salida('t2', 'n1', 'b', 2),
        salida('t3', 'n1', 'c', 3),
        salida('t4', 'n2', true, 1),
        salida('t5', 'n2', false, 2),
      ],
    );

    expect(arbol.diagnosticarCobertura()).toEqual({ nodos_sin_cobertura: [] });
  });

  it('no exige cobertura a un nodo terminal (sin transiciones salientes)', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoConEntrada('n1', { tipo: 'BOOLEANO' })],
      [],
    );

    expect(arbol.diagnosticarCobertura()).toEqual({ nodos_sin_cobertura: [] });
  });

  it('no exige cobertura a otros tipos de respuesta', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoConEntrada('n1', { tipo: 'SELECCION_MULTIPLE', opciones }),
        nodoConEntrada('n2', { tipo: 'NUMERICO', min: 0, max: 5 }),
        nodoSimple('n3'),
      ],
      [],
    );

    expect(arbol.diagnosticarCobertura()).toEqual({ nodos_sin_cobertura: [] });
  });
});

describe('ArbolConversacional.diagnosticarCapturaPerfil (RF-25)', () => {
  it('reporta ambas dimensiones ausentes cuando ningún nodo las marca', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoSimple('n1')],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil()).toEqual({
      dimensiones_ausentes: [
        Dimension.TIPO_DEPENDENCIA,
        Dimension.TIPO_CRAVING,
      ],
      dimensiones_duplicadas: [],
      dimensiones_valores_invalidos: [],
      dimensiones_valores_faltantes: [],
    });
  });

  it('no reporta nada cuando hay exactamente un nodo por dimensión', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoSimple('n1'),
        nodoCaptura('n2', Dimension.TIPO_DEPENDENCIA),
        nodoCaptura('n3', Dimension.TIPO_CRAVING),
      ],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil()).toEqual({
      dimensiones_ausentes: [],
      dimensiones_duplicadas: [],
      dimensiones_valores_invalidos: [],
      dimensiones_valores_faltantes: [],
    });
  });

  it('reporta la dimensión duplicada cuando dos nodos la marcan', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoCaptura('n1', Dimension.TIPO_DEPENDENCIA),
        nodoCaptura('n2', Dimension.TIPO_DEPENDENCIA),
        nodoCaptura('n3', Dimension.TIPO_CRAVING),
      ],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil()).toEqual({
      dimensiones_ausentes: [],
      dimensiones_duplicadas: [Dimension.TIPO_DEPENDENCIA],
      dimensiones_valores_invalidos: [],
      dimensiones_valores_faltantes: [],
    });
  });

  it('reporta solo la dimensión ausente cuando la otra ya está marcada', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoCaptura('n1', Dimension.TIPO_CRAVING)],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil()).toEqual({
      dimensiones_ausentes: [Dimension.TIPO_DEPENDENCIA],
      dimensiones_duplicadas: [],
      dimensiones_valores_invalidos: [],
      dimensiones_valores_faltantes: [],
    });
  });
});

// ── RF-25: nodo final, captura con valor, SIEMPRE y avance implícito ──────

function nodoRF25(
  idNodo: string,
  orden: number,
  contenido: Record<string, unknown>,
  { inicial = false, final = false } = {},
): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    'flujo-1',
    'tipo-1',
    'MENSAJE',
    { texto: idNodo, ...contenido },
    inicial,
    orden,
    null,
    'actor-1',
    fecha,
    fecha,
    final,
  );
}

const siNo = {
  entrada: { tipo: 'OPCION_UNICA', opciones: ['si', 'no'] },
};

function reglaIgual(valor: string): ReglaValidacion {
  return new ReglaValidacion(
    `regla-${valor}`,
    TipoDatoValidacion.TEXTO,
    true,
    null,
    null,
    null,
    [],
    'Elige una opción',
    OperadorCondicion.IGUALDAD,
    { valor },
  );
}

function reglaSiempre(): ReglaValidacion {
  return new ReglaValidacion(
    'regla-siempre',
    TipoDatoValidacion.TEXTO,
    true,
    null,
    null,
    null,
    [],
    'Elige una opción',
    OperadorCondicion.SIEMPRE,
    {},
  );
}

function salidaRF25(
  id: string,
  origen: string,
  destino: string,
  orden: number,
  regla: ReglaValidacion | null,
): TransicionConversacional {
  return new TransicionConversacional(
    id,
    'flujo-1',
    origen,
    destino,
    orden,
    regla,
    fecha,
  );
}

describe('ArbolConversacional · nodo final y avance implícito (RF-25)', () => {
  it('exige exactamente un nodo final', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [nodoRF25('a', 1, {}, { inicial: true }), nodoRF25('b', 2, {})],
      [salidaRF25('t1', 'a', 'b', 1, null)],
    );

    expect(arbol.diagnosticarEstructura()).toMatchObject({
      sin_nodo_final: true,
      // Sin nodo final (legado) no se reportan callejones.
      nodos_sin_salida: [],
    });
  });

  it('un nodo sin respuesta y sin transiciones avanza al siguiente por orden', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoRF25('a', 1, {}, { inicial: true }),
        nodoRF25('b', 2, {}),
        nodoRF25('c', 3, {}, { final: true }),
      ],
      [],
    );

    const diagnostico = arbol.diagnosticarEstructura();
    expect(diagnostico).toMatchObject({
      sin_nodo_inicial: false,
      sin_nodo_final: false,
      nodos_huerfanos: [],
      nodos_sin_salida: [],
      ciclos: [],
    });
    expect(arbol.destinoImplicito(arbol.nodos[0])?.idNodo).toBe('b');
    expect(arbol.destinoImplicito(arbol.nodos[2])).toBeNull();
  });

  it('la transición explícita tiene prioridad sobre el avance implícito', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoRF25('a', 1, {}, { inicial: true }),
        nodoRF25('b', 2, {}),
        nodoRF25('c', 3, {}, { final: true }),
      ],
      [salidaRF25('t1', 'a', 'c', 1, null)],
    );

    expect(arbol.destinoImplicito(arbol.nodos[0])).toBeNull();
    expect(arbol.diagnosticarEstructura().nodos_huerfanos).toEqual([
      { id_nodo: 'b', orden: 2, texto: 'b' },
    ]);
  });

  it('reporta nodos con respuesta que no tienen salida', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoRF25('a', 1, {}, { inicial: true }),
        nodoRF25('b', 2, siNo),
        nodoRF25('c', 3, {}, { final: true }),
      ],
      [],
    );

    expect(arbol.diagnosticarEstructura().nodos_sin_salida).toEqual([
      { id_nodo: 'b', orden: 2, texto: 'b' },
    ]);
  });
});

describe('ArbolConversacional · transición por defecto SIEMPRE (RF-25)', () => {
  const nodos = [
    nodoRF25('a', 1, siNo, { inicial: true }),
    nodoRF25('b', 2, {}),
    nodoRF25('c', 3, {}, { final: true }),
  ];

  it('cubre todas las respuestas en el diagnóstico de cobertura', () => {
    const arbol = new ArbolConversacional(flujoGrupal(), nodos, [
      salidaRF25('t1', 'a', 'b', 1, reglaIgual('si')),
      salidaRF25('t2', 'a', 'c', 2, reglaSiempre()),
    ]);

    expect(arbol.diagnosticarCobertura().nodos_sin_cobertura).toEqual([]);
  });

  it('sugiere el siguiente orden ignorando la transición por defecto', () => {
    const arbol = new ArbolConversacional(flujoGrupal(), nodos, [
      salidaRF25('t1', 'a', 'b', 1, reglaIgual('si')),
      salidaRF25('t2', 'a', 'c', 2, reglaSiempre()),
    ]);

    expect(arbol.siguienteOrdenEvaluacion('a')).toBe(2);
    expect(arbol.siguienteOrdenEvaluacion('b')).toBe(1);
  });

  it('reubica la transición por defecto al final', () => {
    const arbol = new ArbolConversacional(flujoGrupal(), nodos, [
      salidaRF25('t1', 'a', 'b', 1, reglaSiempre()),
      salidaRF25('t2', 'a', 'c', 2, reglaIgual('si')),
    ]);

    expect(arbol.reubicarTransicionPorDefecto('a')?.ordenEvaluacion).toBe(3);
  });

  it('no admite dos transiciones por defecto en el mismo origen', () => {
    const arbol = new ArbolConversacional(flujoGrupal(), nodos, [
      salidaRF25('t1', 'a', 'b', 1, reglaSiempre()),
      salidaRF25('t2', 'a', 'c', 2, reglaSiempre()),
    ]);

    expect(() => arbol.validarTransicionPorDefectoUnica('a')).toThrow(
      'cualquier otra respuesta',
    );
  });
});

describe('ArbolConversacional · captura de perfil con valor (RF-25 / RF-27B)', () => {
  const captura = (dimension: Dimension, valor: string) => ({
    capturaPerfil: { dimension, valor },
  });

  it('acepta varias ramas que cubren todos los valores de cada dimensión', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoRF25('d1', 1, captura(Dimension.TIPO_DEPENDENCIA, 'TOLERANCIA')),
        nodoRF25(
          'd2',
          2,
          captura(Dimension.TIPO_DEPENDENCIA, 'ABSTINENCIA_FISICA'),
        ),
        nodoRF25('d3', 3, captura(Dimension.TIPO_DEPENDENCIA, 'TOLERANCIA')),
        nodoRF25('c1', 4, captura(Dimension.TIPO_CRAVING, 'POSITIVO')),
        nodoRF25('c2', 5, captura(Dimension.TIPO_CRAVING, 'NEGATIVO')),
      ],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil()).toEqual({
      dimensiones_ausentes: [],
      dimensiones_duplicadas: [],
      dimensiones_valores_invalidos: [],
      dimensiones_valores_faltantes: [],
    });
  });

  it('reporta los valores que ninguna rama captura', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoRF25('d1', 1, captura(Dimension.TIPO_DEPENDENCIA, 'TOLERANCIA')),
        nodoRF25('c1', 2, captura(Dimension.TIPO_CRAVING, 'POSITIVO')),
        nodoRF25('c2', 3, captura(Dimension.TIPO_CRAVING, 'NEGATIVO')),
      ],
      [],
    );

    expect(
      arbol.diagnosticarCapturaPerfil().dimensiones_valores_faltantes,
    ).toEqual([
      {
        dimension: Dimension.TIPO_DEPENDENCIA,
        valores_faltantes: ['ABSTINENCIA_FISICA'],
      },
    ]);
  });

  it('no mezcla captura con valor y captura legado en una dimensión', () => {
    const arbol = new ArbolConversacional(
      flujoGrupal(),
      [
        nodoCaptura('legado', Dimension.TIPO_DEPENDENCIA),
        nodoRF25('d1', 2, captura(Dimension.TIPO_DEPENDENCIA, 'TOLERANCIA')),
        nodoCaptura('craving', Dimension.TIPO_CRAVING),
      ],
      [],
    );

    expect(arbol.diagnosticarCapturaPerfil().dimensiones_duplicadas).toEqual([
      Dimension.TIPO_DEPENDENCIA,
    ]);
  });
});
