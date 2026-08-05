export type SessionCookieSameSite = 'lax' | 'strict' | 'none';

export abstract class SessionCookieConfig {
  abstract obtenerNombreCookie(): string;
  abstract esSegura(): boolean;
  abstract obtenerSameSite(): SessionCookieSameSite;
}
