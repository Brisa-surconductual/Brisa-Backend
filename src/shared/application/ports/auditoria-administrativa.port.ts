/**
 * RF-123: registro en la bitácora de auditoría administrativa
 * (administrativo.bitacora_auditoria, vía administrativo.fn_registrar_auditoria).
 *
 * Los valores son los de los enumerados de la base de datos; aquí solo se
 * declaran los que usa hoy el backend.
 */
export type AccionAuditoriaAdministrativa = 'CONSULTA_PARTICIPANTE';

export type EstadoAccionAuditoria = 'EXITOSA' | 'FALLIDA' | 'DENEGADA';

/** Quién actúa: el usuario autenticado y SU sesión de autenticación. */
export interface ActorAuditoria {
  /** usuario.usuarios.id_usuario del solicitante (administrativo o no). */
  idUsuario: string;
  /**
   * usuario.sesiones.id_sesion: la sesión de AUTENTICACIÓN del solicitante.
   * Nunca la sesión conversacional consultada.
   */
  idSesionAutenticacion: string;
  /** Dirección IP de la petición (respeta "trust proxy"). */
  direccionIp: string;
}

/**
 * Detalle no sensible. Nunca debe contener preguntas, respuestas, textos de
 * nodos, contenido clínico ni entradas sin validar del cliente.
 */
export type DetalleAuditoria = Record<string, string | number | null>;

export interface EventoAuditoriaAdministrativa {
  actor: ActorAuditoria;
  accion: AccionAuditoriaAdministrativa;
  recursoAfectado: string;
  idRecurso: string | null;
  idParticipante: string | null;
  estado: EstadoAccionAuditoria;
  detalle: DetalleAuditoria;
}

export abstract class AuditoriaAdministrativaPort {
  /**
   * Registra el evento de forma síncrona y devuelve el id_auditoria.
   * Lanza si no se pudo registrar: quien lo invoca decide la política.
   */
  abstract registrar(evento: EventoAuditoriaAdministrativa): Promise<string>;
}
