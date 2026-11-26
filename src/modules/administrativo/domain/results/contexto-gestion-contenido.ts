import type { ContextoAuditoria } from './contexto-auditoria';

export type ContextoGestionContenido = ContextoAuditoria & {
  idUsuario: string;
};
