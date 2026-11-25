import { VigenciaPermisoInvalidaException } from '../exceptions/permiso-individual.exceptions';
import { VigenciaPermiso } from './vigencia-permiso.vo';

describe('VigenciaPermiso', () => {
  const ahora = new Date('2026-11-25T12:00:00Z');

  it('acepta una vigencia sin fecha de fin', () => {
    expect(VigenciaPermiso.crear(null, ahora).fin).toBeNull();
    expect(VigenciaPermiso.crear(undefined, ahora).fin).toBeNull();
  });

  it('acepta una fecha de fin futura', () => {
    const fin = new Date('2026-12-31T23:59:59Z');
    expect(VigenciaPermiso.crear(fin, ahora).fin).toEqual(fin);
  });

  it.each([
    ['pasada', new Date('2026-11-01T00:00:00Z')],
    ['igual al momento actual', new Date('2026-11-25T12:00:00Z')],
    ['inválida', new Date('no-es-fecha')],
  ])('rechaza una fecha de fin %s', (_caso, fin) => {
    expect(() => VigenciaPermiso.crear(fin, ahora)).toThrow(
      VigenciaPermisoInvalidaException,
    );
  });
});
