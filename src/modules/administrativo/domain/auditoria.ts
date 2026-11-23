export type AccionAdministrativa =
  | 'ACCESO_MODULO'
  | 'CONSULTA_PARTICIPANTE'
  | 'EXPORTACION_DATOS'
  | 'CONFIGURACION_UMBRALES';

export type EstadoAccion = 'EXITOSA' | 'FALLIDA' | 'DENEGADA';

export interface ContextoAuditoria {
  idUsuario: string | null;
  idSesion: string | null;
  direccionIp: string;
}

export interface AccionAuditable {
  accion: AccionAdministrativa;
  recurso: string;
  idRecurso?: string | null;
}

export interface EventoAuditoria extends AccionAuditable {
  estado: EstadoAccion;
  idAuditoria?: string;
}

export interface RegistroAuditoria extends ContextoAuditoria {
  id_auditoria: string;
  accion: AccionAdministrativa;
  recurso_afectado: string;
  id_recurso: string | null;
  marca_temporal: string;
  estado_accion: EstadoAccion;
}

export interface EntradaBitacora {
  id_auditoria: string;
  accion: string;
  recurso_afectado: string;
  id_recurso: string | null;
  direccion_ip: string;
  marca_temporal: Date;
  estado_accion: EstadoAccion;
}
