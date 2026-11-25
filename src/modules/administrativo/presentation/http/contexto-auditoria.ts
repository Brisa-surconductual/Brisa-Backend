import { isIP } from 'node:net';
import type { Request } from 'express';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';

export const ACCESO_BITACORA = {
  accion: 'ACCESO_MODULO',
  recurso: 'BITACORA_AUDITORIA',
} as const;

export function contextoAuditoria(
  request: Request &
    Partial<Pick<AuthenticatedSessionRequest, 'autenticacion'>>,
  autenticacion = request.autenticacion,
): ContextoAuditoria {
  const ip = request.ip ?? request.socket.remoteAddress;
  return {
    idUsuario: autenticacion?.usuario.id_usuario ?? null,
    idSesion: autenticacion?.sesion.id_sesion ?? null,
    direccionIp: ip && isIP(ip) ? ip : 'DESCONOCIDA',
  };
}
