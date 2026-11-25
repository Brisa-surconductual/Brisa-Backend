import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import type { ContextoGestionContenido } from '../../domain/results/contexto-gestion-contenido';
import { contextoAuditoria } from './contexto-auditoria';

export function contextoGestionContenido(
  request: AuthenticatedSessionRequest,
): ContextoGestionContenido {
  return {
    ...contextoAuditoria(request),
    idUsuario: request.autenticacion.usuario.id_usuario,
  };
}
