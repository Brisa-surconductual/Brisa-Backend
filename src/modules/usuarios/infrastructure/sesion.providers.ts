import { SesionRepository } from '../domain/repositories/sesion.repository';
import { SessionConfig } from '../application/ports/session-config';
import { SessionCookieConfig } from '../application/ports/session-cookie-config';
import { SessionTokenGenerator } from '../application/ports/session-token-generator';
import { SessionTokenHasher } from '../application/ports/session-token-hasher';
import { PrismaSesionRepository } from './persistence/prisma-sesion.repository';
import { EnvironmentSessionConfig } from './config/environment-session.config';
import { ExpirarSesionesCron } from './cron/expirar-sesiones.cron';
import { CryptoSessionTokenGenerator } from './security/crypto-session-token-generator';
import { Sha256SessionTokenHasher } from './security/sha256-session-token-hasher';

export const SesionInfrastructureProviders = [
  {
    provide: SesionRepository,
    useClass: PrismaSesionRepository,
  },
  EnvironmentSessionConfig,
  {
    provide: SessionConfig,
    useExisting: EnvironmentSessionConfig,
  },
  {
    provide: SessionCookieConfig,
    useExisting: EnvironmentSessionConfig,
  },
  {
    provide: SessionTokenGenerator,
    useClass: CryptoSessionTokenGenerator,
  },
  {
    provide: SessionTokenHasher,
    useClass: Sha256SessionTokenHasher,
  },
  ExpirarSesionesCron,
];
