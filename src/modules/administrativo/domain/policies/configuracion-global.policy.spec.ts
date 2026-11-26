import {
  contieneCampoPorUsuario,
  sonValoresEquivalentes,
} from './configuracion-global.policy';

describe('Política de configuración global (RF-136, RF-137)', () => {
  describe('sonValoresEquivalentes', () => {
    it.each([
      [3, 3],
      [
        { dias_habiles: 2, fines_semana: 3 },
        { fines_semana: 3, dias_habiles: 2 },
      ],
      [
        [{ nivel: 'INICIAL', min: 0, max: 25 }],
        [{ max: 25, min: 0, nivel: 'INICIAL' }],
      ],
    ])('%j equivale a %j', (a, b) => {
      expect(sonValoresEquivalentes(a, b)).toBe(true);
    });

    it('ignora el prototipo de los objetos (p. ej. de otro parser)', () => {
      const sinPrototipo = Object.assign(Object.create(null) as object, {
        horas: 3,
      });
      expect(sonValoresEquivalentes(sinPrototipo, { horas: 3 })).toBe(true);
    });

    it.each([
      [3, 4],
      [3, '3'],
      [{ horas: 3 }, { horas: 3, extra: 1 }],
      [
        [1, 2],
        [2, 1],
      ],
    ])('%j no equivale a %j', (a, b) => {
      expect(sonValoresEquivalentes(a, b)).toBe(false);
    });
  });

  describe('contieneCampoPorUsuario', () => {
    it.each([
      { id_usuario: 'a' },
      { codigo_participante: 'P-1' },
      { valor_nuevo: { dias_habiles: 2, id_participante: 'x' } },
      { valor_nuevo: [{ segmento: 'MANANA', usuarios: ['a'] }] },
      { ID_ESTUDIANTE: 'x' },
    ])('detecta un campo por usuario en %j', (valor) => {
      expect(contieneCampoPorUsuario(valor)).toBe(true);
    });

    it.each([
      { valor_nuevo: 3, valor_anterior_esperado: 4 },
      { valor_nuevo: [{ segmento: 'MANANA', hora_inicio: '07:00' }] },
      null,
      'texto',
      7,
    ])('acepta la configuración global %j', (valor) => {
      expect(contieneCampoPorUsuario(valor)).toBe(false);
    });
  });
});
