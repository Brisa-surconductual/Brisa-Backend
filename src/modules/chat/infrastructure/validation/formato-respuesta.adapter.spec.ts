import { FormatoRespuestaAdapter } from './formato-respuesta.adapter';
import { ConfiguracionRespuestaInvalida } from '../../domain/policies/motor-respuesta-conversacional.policy';

describe('FormatoRespuestaAdapter', () => {
  const adapter = new FormatoRespuestaAdapter();
  it('aplica el patrón como datos y no cambia el texto', () => {
    expect(adapter.coincide('^[A-Z]{3}$', 'ABC')).toBe(true);
    expect(adapter.coincide('^[A-Z]{3}$', 'abc')).toBe(false);
  });
  it('no ejecuta código proporcionado como texto', () =>
    expect(adapter.coincide('^ABC$', 'process.exit()')).toBe(false));
  it('rechaza formato inválido', () =>
    expect(() => adapter.coincide('[', 'a')).toThrow(
      ConfiguracionRespuestaInvalida,
    ));
  it('limita backtracking sin bloquear indefinidamente el servidor', () => {
    expect(() => adapter.coincide('(a+)+$', 'a'.repeat(100) + '!')).toThrow(
      ConfiguracionRespuestaInvalida,
    );
  });
});
