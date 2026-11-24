import { isUUID } from 'class-validator';
import type { ActorAuditoria } from '../../application/ports/auditoria-administrativa.port';
import type { AuthenticatedSessionRequest } from '../../../modules/usuarios/presentation/http/authenticated-session-request';

/** Longitud de administrativo.bitacora_auditoria.direccion_ip. */
const LONGITUD_MAXIMA_IP = 45;

/**
 * Actor de RF-123 a partir de la petición ya autenticada por SessionAuthGuard:
 * usuario, sesión de AUTENTICACIÓN (usuario.sesiones) e IP de la petición
 * (Express aplica "trust proxy" si TRUST_PROXY está configurado).
 * Devuelve null si falta alguno de los datos que exige la bitácora.
 */
export function actorAuditoria(
  solicitud: Partial<
    Pick<AuthenticatedSessionRequest, 'autenticacion' | 'ip' | 'socket'>
  >,
): ActorAuditoria | null {
  const idUsuario = solicitud.autenticacion?.usuario?.id_usuario;
  const idSesionAutenticacion = solicitud.autenticacion?.sesion?.id_sesion;
  const direccionIp = (
    solicitud.ip ??
    solicitud.socket?.remoteAddress ??
    ''
  ).trim();
  if (
    typeof idUsuario !== 'string' ||
    !isUUID(idUsuario) ||
    typeof idSesionAutenticacion !== 'string' ||
    !isUUID(idSesionAutenticacion) ||
    direccionIp.length === 0 ||
    direccionIp.length > LONGITUD_MAXIMA_IP
  )
    return null;
  return { idUsuario, idSesionAutenticacion, direccionIp };
}
