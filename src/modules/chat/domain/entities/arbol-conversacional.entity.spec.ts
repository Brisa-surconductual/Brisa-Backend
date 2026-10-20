import {
  ArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TransicionConversacional,
} from './arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../enums/arbol-conversacional.enums';
import {
  CicloConversacionalNoPermitidoException,
  NodoInicialInexistenteException,
  NodosHuerfanosException,
  ReglaValidacionInvalidaException,
} from '../exeption/arbol-conversacional.exceptions';

describe('ArbolConversacional (RF-25)', () => {
  const fecha = new Date('2026-09-19T12:00:00.000Z');
  const flujo = new FlujoConversacional(
    'flujo',
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    EstadoFlujoConversacional.BORRADOR,
    1,
    'administrador',
    fecha,
    null,
  );

  const nodo = (id: string, inicial = false) =>
    new NodoConversacional(
      id,
      flujo.idFlujo,
      'tipo',
      'MENSAJE',
      { texto: id },
      inicial,
      null,
      null,
      'administrador',
      fecha,
      fecha,
    );

  const regla = () =>
    new ReglaValidacion(
      'validacion',
      TipoDatoValidacion.TEXTO,
      true,
      null,
      null,
      null,
      [],
      'Respuesta requerida',
    );

  const transicion = (origen: string, destino: string, orden = 1) =>
    new TransicionConversacional(
      `${origen}-${destino}`,
      flujo.idFlujo,
      origen,
      destino,
      OperadorCondicion.IGUALDAD,
      true,
      orden,
      regla(),
      fecha,
    );

  it('acepta una estructura ramificada alcanzable y sin ciclos', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A', true), nodo('B'), nodo('C'), nodo('D')],
      [transicion('A', 'B'), transicion('B', 'C'), transicion('B', 'D', 2)],
    );

    expect(arbol.validarEstructura()).toEqual({
      valido: true,
      totalNodos: 4,
      totalTransiciones: 3,
    });
  });

  it('detecta un nodo huérfano', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A', true), nodo('B'), nodo('D')],
      [transicion('A', 'B')],
    );

    expect(() => arbol.validarEstructura()).toThrow(NodosHuerfanosException);
    try {
      arbol.validarEstructura();
    } catch (error) {
      expect((error as NodosHuerfanosException).cantidad).toBe(1);
    }
  });

  it('detecta varios nodos huérfanos', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A', true), nodo('B'), nodo('C'), nodo('D')],
      [transicion('A', 'B')],
    );

    try {
      arbol.validarEstructura();
      fail('La validación debió rechazar los nodos huérfanos.');
    } catch (error) {
      expect(error).toBeInstanceOf(NodosHuerfanosException);
      expect((error as NodosHuerfanosException).cantidad).toBe(2);
    }
  });

  it('rechaza un ciclo dirigido', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A', true), nodo('B'), nodo('C')],
      [transicion('A', 'B'), transicion('B', 'C'), transicion('C', 'B')],
    );

    expect(() => arbol.validarEstructura()).toThrow(
      CicloConversacionalNoPermitidoException,
    );
  });

  it('rechaza una autorreferencia como ciclo', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A', true)],
      [transicion('A', 'A')],
    );

    expect(() => arbol.validarAusenciaCiclos()).toThrow(
      CicloConversacionalNoPermitidoException,
    );
  });

  it('rechaza un árbol sin nodo inicial', () => {
    const arbol = new ArbolConversacional(
      flujo,
      [nodo('A'), nodo('B')],
      [transicion('A', 'B')],
    );

    expect(() => arbol.validarEstructura()).toThrow(
      NodoInicialInexistenteException,
    );
  });

  it('rechaza una regla numérica con rango incoherente', () => {
    expect(
      () =>
        new ReglaValidacion(
          'validacion',
          TipoDatoValidacion.NUMERICO,
          true,
          10,
          5,
          null,
          [],
          'Fuera de rango',
        ),
    ).toThrow(ReglaValidacionInvalidaException);
  });

  it('rechaza una selección sin valores permitidos', () => {
    expect(
      () =>
        new ReglaValidacion(
          'validacion',
          TipoDatoValidacion.SELECCION,
          true,
          null,
          null,
          null,
          [],
          'Seleccione una opción',
        ),
    ).toThrow(ReglaValidacionInvalidaException);
  });
});
