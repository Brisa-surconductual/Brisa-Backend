import { NO_CALCULABLE, tasaPresentable } from './tasa-notificacion.policy';

describe('tasaPresentable (RF-131)', () => {
  it('presenta el valor que calcula M07 sin recalcularlo', () => {
    expect(tasaPresentable(0.61, 114)).toBe(0.61);
    expect(tasaPresentable(0, 114)).toBe(0);
  });

  it.each([
    ['NO_CALCULABLE de M07', NO_CALCULABLE],
    ['null', null],
    ['ausente', undefined],
    ['NaN', Number.NaN],
    ['infinito', Number.POSITIVE_INFINITY],
  ] as const)('marca NO_CALCULABLE si M07 envía %s', (_caso, tasa) => {
    expect(tasaPresentable(tasa, 114)).toBe(NO_CALCULABLE);
  });

  it('marca NO_CALCULABLE si el denominador es cero, aunque M07 envíe un valor', () => {
    expect(tasaPresentable(0, 0)).toBe(NO_CALCULABLE);
    expect(tasaPresentable(0.5, 0)).toBe(NO_CALCULABLE);
  });
});
