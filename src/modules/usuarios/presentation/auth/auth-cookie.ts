import { CookieOptions } from 'express';

export function getAuthCookieName(): string {
  return (
    process.env.AUTH_COOKIE_NAME ??
    (process.env.NODE_ENV === 'production'
      ? '__Host-brisa_access_token'
      : 'brisa_access_token')
  );
}

export function getCsrfCookieName(): string {
  return process.env.CSRF_COOKIE_NAME ?? 'brisa_csrf_token';
}

export function getAuthCookieOptions(maxAge?: number): CookieOptions {
  const sameSiteValue = (
    process.env.AUTH_COOKIE_SAME_SITE ?? 'strict'
  ).toLowerCase();
  const sameSite: CookieOptions['sameSite'] =
    sameSiteValue === 'lax'
      ? 'lax'
      : sameSiteValue === 'none'
        ? 'none'
        : 'strict';
  const secure =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production';

  if (sameSite === 'none' && !secure) {
    throw new Error('SameSite=None requires AUTH_COOKIE_SECURE=true.');
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

export function getCsrfCookieOptions(maxAge?: number): CookieOptions {
  return {
    ...getAuthCookieOptions(maxAge),
    httpOnly: false,
  };
}
