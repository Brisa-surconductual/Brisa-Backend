import { Injectable } from '@nestjs/common';
import { ModuloInternoCredentialsConfigPort } from '../../application/ports/modulo-interno-credentials-config.port';

const VARIABLE_HASH_POR_MODULO: Readonly<Record<string, string>> = {
  CHAT: 'INTERNAL_MODULE_API_KEY_HASH_CHAT',
  SEGUIM: 'INTERNAL_MODULE_API_KEY_HASH_SEGUIM',
  GAMIF: 'INTERNAL_MODULE_API_KEY_HASH_GAMIF',
  NOTIF: 'INTERNAL_MODULE_API_KEY_HASH_NOTIF',
};

@Injectable()
export class EnvironmentModuloInternoCredentialsConfig implements ModuloInternoCredentialsConfigPort {
  obtenerApiKeyHash(codigoModulo: string): string | null {
    const variable = VARIABLE_HASH_POR_MODULO[codigoModulo];
    if (!variable) {
      return null;
    }

    const hash = process.env[variable]?.trim().toLowerCase();
    return hash && /^[0-9a-f]{64}$/.test(hash) ? hash : null;
  }
}
