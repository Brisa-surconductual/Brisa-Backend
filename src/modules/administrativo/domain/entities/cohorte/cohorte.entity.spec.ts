import { EstadoCohorte } from '../../enums/estado-cohorte.enum';
import {
  FechasCohorteInvalidasException,
  TransicionCohorteInvalidaException,
} from '../../exceptions/cohorte.exceptions';
import type { DatosCohorte } from './cohorte.entity';
import {
  validarFechasCohorte,
  validarTransicionCohorte,
} from './cohorte.entity';

const datos = (inicio: string, fin: string): DatosCohorte => ({
  nombre_cohorte: 'Cohorte',
  fecha_inicio_programa: inicio,
  fecha_fin_programa: fin,
  id_cronograma: 'cronograma',
});

describe('RF-124 reglas de la cohorte', () => {
  it.each([
    ['2026-01-01', '2026-01-01'],
    ['2026-01-01', '2026-06-30'],
  ])('acepta el programa de %s a %s', (inicio, fin) => {
    expect(() => validarFechasCohorte(datos(inicio, fin))).not.toThrow();
  });

  it('rechaza un programa que termina antes de empezar', () => {
    expect(() =>
      validarFechasCohorte(datos('2026-06-30', '2026-01-01')),
    ).toThrow(FechasCohorteInvalidasException);
  });

  it.each([
    [EstadoCohorte.BORRADOR, EstadoCohorte.ACTIVA],
    [EstadoCohorte.ACTIVA, EstadoCohorte.INACTIVA],
    [EstadoCohorte.INACTIVA, EstadoCohorte.ACTIVA],
  ])('permite la transición %s -> %s', (actual, destino) => {
    expect(() => validarTransicionCohorte(actual, destino)).not.toThrow();
  });

  it.each([
    [EstadoCohorte.BORRADOR, EstadoCohorte.INACTIVA],
    [EstadoCohorte.BORRADOR, EstadoCohorte.BORRADOR],
    [EstadoCohorte.ACTIVA, EstadoCohorte.ACTIVA],
    [EstadoCohorte.ACTIVA, EstadoCohorte.BORRADOR],
    [EstadoCohorte.INACTIVA, EstadoCohorte.BORRADOR],
  ])('rechaza la transición %s -> %s', (actual, destino) => {
    expect(() => validarTransicionCohorte(actual, destino)).toThrow(
      TransicionCohorteInvalidaException,
    );
  });
});
