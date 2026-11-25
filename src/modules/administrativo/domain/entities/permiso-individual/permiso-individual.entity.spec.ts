import { AlcancePermiso } from '../../enums/alcance-permiso.enum';
import { PermisoYaRevocadoException } from '../../exceptions/permiso-individual.exceptions';
import {
  type DatosPermisoIndividual,
  PermisoIndividual,
} from './permiso-individual.entity';

describe('PermisoIndividual', () => {
  const ahora = new Date('2026-11-25T12:00:00Z');
  const base: DatosPermisoIndividual = {
    id_permiso: '11111111-1111-4111-8111-111111111111',
    id_usuario_beneficiario: '22222222-2222-4222-8222-222222222222',
    codigo_participante: 'P-7F3A91C2',
    alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
    fecha_inicio_vigencia: new Date('2026-11-23T03:00:00Z'),
    fecha_fin_vigencia: null,
    revocado_en: null,
  };
  const permiso = (cambios: Partial<DatosPermisoIndividual> = {}) =>
    new PermisoIndividual({ ...base, ...cambios });

  it('está vigente si no se revocó, ya inició y no tiene fin', () => {
    expect(permiso().estaVigente(ahora)).toBe(true);
  });

  it('está vigente con fin futuro', () => {
    expect(
      permiso({
        fecha_fin_vigencia: new Date('2026-12-31T23:59:59Z'),
      }).estaVigente(ahora),
    ).toBe(true);
  });

  it.each<[string, Partial<DatosPermisoIndividual>]>([
    ['revocado', { revocado_en: new Date('2026-11-24T00:00:00Z') }],
    ['vencido', { fecha_fin_vigencia: new Date('2026-11-25T12:00:00Z') }],
    [
      'no iniciado',
      { fecha_inicio_vigencia: new Date('2026-11-26T00:00:00Z') },
    ],
  ])('no está vigente si está %s', (_caso, cambios) => {
    expect(permiso(cambios).estaVigente(ahora)).toBe(false);
  });

  it('solo se puede revocar una vez', () => {
    expect(() => permiso().asegurarRevocable()).not.toThrow();
    expect(() =>
      permiso({
        revocado_en: new Date('2026-11-24T00:00:00Z'),
      }).asegurarRevocable(),
    ).toThrow(PermisoYaRevocadoException);
  });
});
