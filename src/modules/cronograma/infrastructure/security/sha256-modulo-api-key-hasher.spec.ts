import { createHash } from 'crypto';
import { Sha256ModuloApiKeyHasher } from './sha256-modulo-api-key-hasher';

describe('Sha256ModuloApiKeyHasher', () => {
  const hasher = new Sha256ModuloApiKeyHasher();
  const apiKey = 'api-key-interna-segura-de-32-bytes-minimo';
  const hash = createHash('sha256').update(apiKey).digest('hex');

  it('compara una API key válida con su hash', () => {
    expect(hasher.comparar(apiKey, hash)).toBe(true);
  });

  it('usa una comparación negativa para una API key diferente', () => {
    expect(hasher.comparar(`${apiKey}-incorrecta`, hash)).toBe(false);
  });

  it.each([
    ['clave-corta', hash],
    [apiKey, 'hash-invalido'],
    ['a'.repeat(513), hash],
  ])('rechaza credenciales con formato inseguro', (token, esperado) => {
    expect(hasher.comparar(token, esperado)).toBe(false);
  });
});
