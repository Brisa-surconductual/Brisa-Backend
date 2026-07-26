import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { AccessTokenService } from '../../application/ports/access-token.service';
import { ValidarSesionUseCase } from '../../application/use-cases/validar-sesion.use-case';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';
import { AuthenticatedRequest } from './authenticated-request';
import { getAuthCookieName, getCsrfCookieName } from './auth-cookie';

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly validarSesion: ValidarSesionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const credentials = this.extractToken(request);
    if (!credentials) {
      throw new SesionInvalidaException();
    }

    if (credentials.transport === 'cookie') {
      this.validateCsrf(request);
    }

    const claims = await this.accessTokenService.verificar(credentials.token);
    const validation = await this.validarSesion.execute(claims);
    (request as AuthenticatedRequest).user = validation.claims;
    return true;
  }

  private extractToken(
    request: Request,
  ): { token: string; transport: 'bearer' | 'cookie' } | null {
    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      return token ? { token, transport: 'bearer' } : null;
    }

    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[getAuthCookieName()];
    return token ? { token, transport: 'cookie' } : null;
  }

  private validateCsrf(request: Request): void {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return;
    }

    const cookies = request.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.[getCsrfCookieName()];
    const header = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(header) ? header[0] : header;

    if (
      !cookieToken ||
      !headerToken ||
      cookieToken.length !== headerToken.length ||
      !timingSafeEqual(
        Buffer.from(cookieToken, 'utf8'),
        Buffer.from(headerToken, 'utf8'),
      )
    ) {
      throw new SesionInvalidaException('La validación CSRF no es válida.');
    }
  }
}
