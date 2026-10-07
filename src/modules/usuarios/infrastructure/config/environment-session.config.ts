import { Injectable } from '@nestjs/common';
import { SessionConfig } from '../../application/ports/session-config';
import {
  SessionCookieConfig,
  SessionCookieSameSite,
} from '../../application/ports/session-cookie-config';
import { CookieOptions } from 'express';

@Injectable()
export class EnvironmentSessionConfig
  implements SessionConfig, SessionCookieConfig
{
  obtenerLimiteInactividadMinutos(): number {
    return 15;
  }

  obtenerLimiteSegundoPlanoMinutos(): number {
    const configurado = Number(
      process.env.SESSION_BACKGROUND_TIMEOUT_MINUTES ?? '15',
    );

    if (!Number.isInteger(configurado) || configurado <= 0) {
      return 15;
    }

    return configurado;
  }

  obtenerNombreCookie(): string {
    return (
      process.env.SESSION_COOKIE_NAME ??
      (process.env.NODE_ENV === 'production'
        ? '__Host-brisa_session'
        : 'brisa_session')
    );
  }


    obtenerOpcionesCookie(): CookieOptions {
      return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60,
        path: '/',
      };

  }

  esSegura(): boolean {
    const configurado = process.env.SESSION_COOKIE_SECURE;
    if (configurado === 'true') return true;
    if (configurado === 'false') return false;
    return process.env.NODE_ENV === 'production';
  }

  obtenerSameSite(): SessionCookieSameSite {
    const configurado = process.env.SESSION_COOKIE_SAME_SITE?.toLowerCase();

    if (configurado === 'strict' || configurado === 'none') {
      if (configurado === 'none' && !this.esSegura()) return 'lax';
      return configurado;
    }

    return 'lax';
  }
}
