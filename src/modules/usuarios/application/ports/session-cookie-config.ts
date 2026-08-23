export type SessionCookieSameSite = 'lax' | 'strict' | 'none';
import  { CookieOptions } from 'express';
export abstract class SessionCookieConfig {
  abstract obtenerNombreCookie(): string;
  abstract esSegura(): boolean;
  abstract obtenerSameSite(): SessionCookieSameSite;
  abstract obtenerOpcionesCookie(): CookieOptions
}
