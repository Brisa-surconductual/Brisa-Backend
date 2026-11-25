import type { IndicadoresParticipanteListado } from '../results/listado-indicadores';
import {
  filtrarIndicadores,
  ordenarIndicadores,
  paginar,
} from './listado-indicadores.policy';

const fila = (
  codigo: string,
  cambios: Partial<IndicadoresParticipanteListado> = {},
): IndicadoresParticipanteListado => ({
  codigo_participante: codigo,
  nivel_progreso: 'EN_AVANCE',
  tasa_adherencia: 0.5,
  alertas_activas: 0,
  alertas_atendidas: 0,
  tipos_alerta_activa: [],
  ...cambios,
});

const codigos = (filas: IndicadoresParticipanteListado[]) =>
  filas.map((f) => f.codigo_participante);

describe('Política del listado de indicadores (RF-142)', () => {
  const filas = [
    fila('P-A', {
      nivel_progreso: 'COMPLETADO',
      tasa_adherencia: 0.9,
      alertas_activas: 0,
    }),
    fila('P-B', {
      nivel_progreso: 'INICIAL',
      tasa_adherencia: 0.2,
      alertas_activas: 2,
      alertas_atendidas: 1,
    }),
    fila('P-C', {
      nivel_progreso: 'EN_AVANCE',
      tasa_adherencia: 0.41,
      alertas_activas: 1,
    }),
    fila('P-D', { nivel_progreso: null, tasa_adherencia: null }),
    fila('P-E', {
      nivel_progreso: 'AVANZADO',
      tasa_adherencia: 0.5,
      alertas_activas: 1,
      alertas_atendidas: 2,
    }),
  ];

  describe('filtrarIndicadores', () => {
    it('sin filtros devuelve todo', () => {
      expect(filtrarIndicadores(filas, {})).toHaveLength(5);
    });

    it('filtra por nivel de progreso', () => {
      expect(
        codigos(filtrarIndicadores(filas, { nivel_progreso: 'EN_AVANCE' })),
      ).toEqual(['P-C']);
    });

    it('filtra por rango de adherencia (límites incluidos) y excluye a quien no tiene dato', () => {
      expect(
        codigos(
          filtrarIndicadores(filas, {
            adherencia_min: 0.41,
            adherencia_max: 0.5,
          }),
        ),
      ).toEqual(['P-C', 'P-E']);
      expect(codigos(filtrarIndicadores(filas, { adherencia_min: 0 }))).toEqual(
        ['P-A', 'P-B', 'P-C', 'P-E'],
      );
    });

    it('con_alertas usa las alertas sin atender', () => {
      expect(codigos(filtrarIndicadores(filas, { con_alertas: true }))).toEqual(
        ['P-B', 'P-C', 'P-E'],
      );
      expect(
        codigos(filtrarIndicadores(filas, { con_alertas: false })),
      ).toEqual(['P-A', 'P-D']);
    });

    it('combina los filtros (todos deben cumplirse)', () => {
      expect(
        codigos(
          filtrarIndicadores(filas, {
            con_alertas: true,
            adherencia_max: 0.45,
            nivel_progreso: 'INICIAL',
          }),
        ),
      ).toEqual(['P-B']);
    });
  });

  describe('ordenarIndicadores', () => {
    it.each([
      ['tasa_adherencia', 'ASC', ['P-B', 'P-C', 'P-E', 'P-A', 'P-D']],
      ['tasa_adherencia', 'DESC', ['P-A', 'P-E', 'P-C', 'P-B', 'P-D']],
      ['nivel_progreso', 'ASC', ['P-B', 'P-C', 'P-E', 'P-A', 'P-D']],
      ['nivel_progreso', 'DESC', ['P-A', 'P-E', 'P-C', 'P-B', 'P-D']],
      ['alertas_activas', 'DESC', ['P-B', 'P-C', 'P-E', 'P-A', 'P-D']],
      ['alertas_atendidas', 'DESC', ['P-E', 'P-B', 'P-A', 'P-C', 'P-D']],
      ['codigo_participante', 'DESC', ['P-E', 'P-D', 'P-C', 'P-B', 'P-A']],
    ] as const)(
      'ordena por %s %s (sin dato al final, desempate por código)',
      (campo, direccion, esperado) => {
        expect(
          codigos(ordenarIndicadores(filas, { campo, direccion })),
        ).toEqual(esperado);
      },
    );

    it('no modifica la lista original', () => {
      const copia = [...filas];
      ordenarIndicadores(filas, { campo: 'tasa_adherencia', direccion: 'ASC' });
      expect(filas).toEqual(copia);
    });
  });

  describe('paginar', () => {
    it('corta la página y devuelve el total antes de paginar', () => {
      expect(
        paginar(['a', 'b', 'c', 'd', 'e'], { offset: 2, limit: 2 }),
      ).toEqual({ items: ['c', 'd'], total: 5 });
      expect(paginar(['a'], { offset: 5, limit: 20 })).toEqual({
        items: [],
        total: 1,
      });
    });
  });
});
