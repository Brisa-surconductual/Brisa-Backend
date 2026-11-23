import { isIP } from 'node:net';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import type { ContextoAuditoria } from '../../domain/auditoria';

export const ACCESO_BITACORA = {
  accion: 'ACCESO_MODULO',
  recurso: 'BITACORA_AUDITORIA',
} as const;

export function contextoAuditoria(
  request: AuthenticatedSessionRequest,
): ContextoAuditoria {
  const ip = request.ip ?? request.socket.remoteAddress;
  return {
    idUsuario: request.autenticacion?.usuario.id_usuario ?? null,
    idSesion: request.autenticacion?.sesion.id_sesion ?? null,
    direccionIp: ip && isIP(ip) ? ip : 'DESCONOCIDA',
  };
}
