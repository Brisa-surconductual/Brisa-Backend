import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { OperadorCondicion } from '../enums/operador-condicional.enum';
import {
  DimensionPerfilClinico as Dimension,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../enums/tipo-dato-validacion-enum';
import {
  CapturaPerfilInvalidaException,
  NodoFinalConCapturaException,
  NodoFinalConEntradaException,
  NodoFinalConSalidasException,
  NodoInicialYFinalException,
  ReglaValidacionInvalidaException,
} from '../exceptions';
import { CapturaPerfilRespuestaPolicy } from './captura-perfil-respuesta.policy';
import { normalizarContenidoNodo } from './contenido-nodo.policy';
import {
  extraerCapturaPerfil,
  validarCapturaPerfilNodo,
} from './dimension-captura-perfil';
import { NodoFinalPolicy, siguienteNodoPorOrden } from './nodo-final.policy';
import {
  construirReglaPorDefecto,
  construirReglaTransicion,
} from './regla-por-tipo-entrada';

const fecha = new Date('2026-11-21T12:00:00.000Z');

function nodo(
  idNodo: string,
  orden: number | null,
  contenido: Record<string, unknown> = { texto: idNodo },
  { inicial = false, final = false } = {},
): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    'flujo',
    'tipo',
    'MENSAJE',
    contenido,
    inicial,
    orden,
    null,
    'actor',
    fecha,
    fecha,
    final,
  );
}

describe('NodoFinalPolicy (RF-25)', () => {
  const politica = new NodoFinalPolicy();

  it('acepta un nodo final sin respuesta ni salidas', () => {
    expect(() =>
      politica.validar(nodo('f', 3, { texto: 'Fin' }, { final: true }), false),
    ).not.toThrow();
  });

  it.each([
    [
      'inicial y final a la vez',
      nodo('f', 1, { texto: 'Fin' }, { inicial: true, final: true }),
      false,
      NodoInicialYFinalException,
    ],
    [
      'con respuesta',
      nodo(
        'f',
        3,
        { texto: 'Fin', entrada: { tipo: 'BOOLEANO' } },
        { final: true },
      ),
      false,
      NodoFinalConEntradaException,
    ],
    [
      'con captura de perfil',
      nodo(
        'f',
        3,
        {
          texto: 'Fin',
          capturaPerfil: {
            dimension: Dimension.TIPO_DEPENDENCIA,
            valor: 'TOLERANCIA',
          },
        },
        { final: true },
      ),
      false,
      NodoFinalConCapturaException,
    ],
    [
      'con salidas',
      nodo('f', 3, { texto: 'Fin' }, { final: true }),
      true,
      NodoFinalConSalidasException,
    ],
  ])('rechaza un nodo final %s', (_caso, candidato, salidas, error) => {
    expect(() => politica.validar(candidato, salidas)).toThrow(error);
  });
});

describe('siguienteNodoPorOrden (RF-25)', () => {
  const nodos = [
    nodo('a', 1, undefined, { inicial: true }),
    nodo('c', 3, undefined, { final: true }),
    nodo('b', 2),
  ];

  it('devuelve el siguiente nodo por orden', () => {
    expect(siguienteNodoPorOrden(nodos, nodos[0])?.idNodo).toBe('b');
    expect(siguienteNodoPorOrden(nodos, nodos[2])?.idNodo).toBe('c');
  });

  it('no aplica desde el nodo final ni en flujos legado sin nodo final', () => {
    expect(siguienteNodoPorOrden(nodos, nodos[1])).toBeNull();
    const legado = [nodo('a', 1), nodo('b', 2)];
    expect(siguienteNodoPorOrden(legado, legado[0])).toBeNull();
  });
});

describe('Captura de perfil con valor (RF-25 / RF-27B)', () => {
  it('lee la dimensión y el valor', () => {
    expect(
      extraerCapturaPerfil({
        capturaPerfil: {
          dimension: Dimension.TIPO_DEPENDENCIA,
          valor: 'ABSTINENCIA_FISICA',
        },
      }),
    ).toEqual({
      dimension: Dimension.TIPO_DEPENDENCIA,
      valor: 'ABSTINENCIA_FISICA',
    });
    expect(
      extraerCapturaPerfil({ capturaPerfil: Dimension.TIPO_CRAVING }),
    ).toEqual({ dimension: Dimension.TIPO_CRAVING, valor: null });
  });

  it('rechaza en administración un valor de otra dimensión', () => {
    expect(() =>
      validarCapturaPerfilNodo({
        capturaPerfil: {
          dimension: Dimension.TIPO_CRAVING,
          valor: 'TOLERANCIA',
        },
      }),
    ).toThrow(CapturaPerfilInvalidaException);
  });

  it('el nodo con valor asigna ese valor sin importar la respuesta', () => {
    const politica = new CapturaPerfilRespuestaPolicy();
    const captura = nodo('n', 2, {
      texto: 'Seguimos',
      capturaPerfil: {
        dimension: Dimension.TIPO_DEPENDENCIA,
        valor: 'TOLERANCIA',
      },
    });

    expect(politica.capturar(captura, null)).toEqual({
      dimension: Dimension.TIPO_DEPENDENCIA,
      valor: TipoDependenciaClinica.TOLERANCIA,
    });
  });
});

describe('Regla "cualquier otra respuesta" (RF-25)', () => {
  const siNo = {
    texto: '¿Sí o no?',
    entrada: { tipo: 'OPCION_UNICA', opciones: ['si', 'no'] },
  };

  it('se construye con SIEMPRE y valor esperado vacío', () => {
    expect(construirReglaPorDefecto(siNo)).toMatchObject({
      operadorCondicion: OperadorCondicion.SIEMPRE,
      valorEsperado: {},
      tipoDato: TipoDatoValidacion.TEXTO,
    });
    expect(
      construirReglaTransicion(siNo, {
        operador: OperadorCondicion.SIEMPRE,
        valorEsperado: undefined,
        mensajeError: '',
      })?.operadorCondicion,
    ).toBe(OperadorCondicion.SIEMPRE);
  });

  it('se permite desde texto libre, pero no desde un nodo sin respuesta', () => {
    expect(
      construirReglaPorDefecto({ entrada: { tipo: 'TEXTO_LIBRE' } })
        .operadorCondicion,
    ).toBe(OperadorCondicion.SIEMPRE);
    expect(() => construirReglaPorDefecto({ texto: 'Info' })).toThrow(
      ReglaValidacionInvalidaException,
    );
  });
});

describe('normalizarContenidoNodo (RF-25)', () => {
  it('descarta el paso de la escala numérica', () => {
    expect(
      normalizarContenidoNodo({
        texto: 'Escala',
        entrada: { tipo: 'ESCALA', min: 1, max: 5, paso: 2 },
      }),
    ).toEqual({ texto: 'Escala', entrada: { tipo: 'ESCALA', min: 1, max: 5 } });
  });

  it('conserva el paso de NUMERICO', () => {
    const numerico = { entrada: { tipo: 'NUMERICO', min: 0, max: 9, paso: 3 } };
    expect(normalizarContenidoNodo(numerico)).toBe(numerico);
  });
});
