import { EnvironmentModuloInternoCredentialsConfig } from './environment-modulo-interno-credentials.config';

describe('EnvironmentModuloInternoCredentialsConfig', () => {
  const entornoOriginal = { ...process.env };
  const config = new EnvironmentModuloInternoCredentialsConfig();

  beforeEach(() => {
    process.env = { ...entornoOriginal };
    delete process.env.INTERNAL_MODULE_API_KEY_HASH_CHAT;
    delete process.env.INTERNAL_MODULE_API_KEY_HASH_SEGUIM;
    delete process.env.INTERNAL_MODULE_API_KEY_HASH_GAMIF;
    delete process.env.INTERNAL_MODULE_API_KEY_HASH_NOTIF;
  });

  afterAll(() => {
    process.env = entornoOriginal;
  });

  it.each([
    ['CHAT', 'INTERNAL_MODULE_API_KEY_HASH_CHAT'],
    ['SEGUIM', 'INTERNAL_MODULE_API_KEY_HASH_SEGUIM'],
    ['GAMIF', 'INTERNAL_MODULE_API_KEY_HASH_GAMIF'],
    ['NOTIF', 'INTERNAL_MODULE_API_KEY_HASH_NOTIF'],
  ])('retorna el hash SHA-256 configurado para %s', (codigo, variable) => {
    process.env[variable] = 'a'.repeat(64);

    expect(config.obtenerApiKeyHash(codigo)).toBe('a'.repeat(64));
  });

  it.each(['DIARIO', 'DESCONOCIDO'])(
    'rechaza el módulo no autorizado %s aunque exista una variable',
    (codigo) => {
      process.env[`INTERNAL_MODULE_API_KEY_HASH_${codigo}`] = 'a'.repeat(64);

      expect(config.obtenerApiKeyHash(codigo)).toBeNull();
    },
  );

  it.each(['corto', 'g'.repeat(64)])(
    'rechaza un hash mal configurado',
    (hash) => {
      process.env.INTERNAL_MODULE_API_KEY_HASH_CHAT = hash;

      expect(config.obtenerApiKeyHash('CHAT')).toBeNull();
    },
  );
});
