import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import {
  OrdenNodoConSaltoException,
  OrdenNodoDuplicadoException,
  OrdenNodoInicialInvalidoException,
} from '../exceptions';
import { OrdenNodoPolicy } from './orden-nodo.policy';

describe('OrdenNodoPolicy', () => {
  const policy = new OrdenNodoPolicy();
  const fecha = new Date('2026-11-16T00:00:00.000Z');

  const nodoCon = (idNodo: string, orden: number | null) =>
    new NodoConversacional(
      idNodo,
      'flujo-1',
      'tipo-1',
      'MENSAJE',
      { texto: 'x' },
      false,
      orden,
      null,
      'actor-1',
      fecha,
      fecha,
    );

  it('permite el primer nodo con orden 1', () => {
    expect(() => policy.validar([], null, 1, false)).not.toThrow();
  });

  it('permite el siguiente orden disponible', () => {
    const hermanos = [nodoCon('a', 1), nodoCon('b', 2)];
    expect(() => policy.validar(hermanos, null, 3, false)).not.toThrow();
  });

  it('rechaza un orden que se salta un número', () => {
    const hermanos = [nodoCon('a', 1)];
    expect(() => policy.validar(hermanos, null, 3, false)).toThrow(
      OrdenNodoConSaltoException,
    );
  });

  it('rechaza un orden ya usado por otro nodo', () => {
    const hermanos = [nodoCon('a', 1), nodoCon('b', 2)];
    expect(() => policy.validar(hermanos, null, 2, false)).toThrow(
      OrdenNodoDuplicadoException,
    );
  });

  it('no cuenta al propio nodo como "otro" al editarlo', () => {
    const hermanos = [nodoCon('a', 1), nodoCon('b', 2)];
    expect(() => policy.validar(hermanos, 'b', 2, false)).not.toThrow();
  });

  it('rechaza el nodo inicial si su orden no es 1', () => {
    expect(() => policy.validar([], null, 2, true)).toThrow(
      OrdenNodoInicialInvalidoException,
    );
  });

  it('rechaza el nodo inicial sin orden', () => {
    expect(() => policy.validar([], null, null, true)).toThrow(
      OrdenNodoInicialInvalidoException,
    );
  });

  it('permite el nodo inicial con orden 1', () => {
    expect(() => policy.validar([], null, 1, true)).not.toThrow();
  });

  it('no valida nada si el nodo no tiene orden y no es inicial', () => {
    const hermanos = [nodoCon('a', 1), nodoCon('b', 5)];
    expect(() => policy.validar(hermanos, null, null, false)).not.toThrow();
  });
});
