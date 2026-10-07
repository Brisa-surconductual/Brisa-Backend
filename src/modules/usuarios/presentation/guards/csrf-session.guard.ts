import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CsrfTokenInvalidoException } from '../../domain/exeption/csrf-token-invalido.exception';
import { SessionTokenHasher } from '../../application/ports/session-token-hasher';
import { AuthenticatedSessionRequest } from '../http/authenticated-session-request';

@Injectable()
export class CsrfSessionGuard implements CanActivate {
  constructor(private readonly sessionTokenHasher: SessionTokenHasher) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedSessionRequest>();
    const csrfToken = request.header('x-csrf-token');
    const esperado = request.autenticacion?.sesion.csrf_token_hash;

    if (!csrfToken || !esperado) {
      throw new CsrfTokenInvalidoException();
    }

    const valido = await this.sessionTokenHasher.compare(csrfToken, esperado);
    if (!valido) {
      throw new CsrfTokenInvalidoException();
    }

    return true;
  }
}
