/** Quién y desde dónde ejecuta una acción administrativa auditada (RF-123). */
export interface ContextoAuditoria {
  idUsuario: string | null;
  idSesion: string | null;
  direccionIp: string;
}
