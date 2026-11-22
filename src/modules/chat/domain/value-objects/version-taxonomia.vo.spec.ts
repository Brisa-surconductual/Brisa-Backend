import { VersionTaxonomia } from './version-taxonomia.vo';

describe('RF-30B VersionTaxonomia', () => {
  it('sube la versión menor sin perder el orden numérico', () => {
    expect(VersionTaxonomia.de('1.0').siguiente().toString()).toBe('1.1');
    expect(VersionTaxonomia.de('1.9').siguiente().toString()).toBe('1.10');
  });

  it.each(['1', 'v1.0', '1.0.0', ''])('rechaza %p', (texto) => {
    expect(() => VersionTaxonomia.de(texto)).toThrow();
  });
});
