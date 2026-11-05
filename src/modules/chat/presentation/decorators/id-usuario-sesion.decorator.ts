import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';

/** Identificador del usuario de la sesión autenticada (nunca viene del cuerpo). */
export const IdUsuarioSesion = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): string =>
    contexto.switchToHttp().getRequest<AuthenticatedSessionRequest>()
      .autenticacion.usuario.id_usuario,
);
