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
    { texto: 'Pregunta clínica', capturaPerfil: { dimension } },
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
    });
  });
});
