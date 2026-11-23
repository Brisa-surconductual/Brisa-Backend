import { PaginaSesionesParticipante } from '../../domain/repositories/sesion-conversacional.repository';

/** RF-38 (M-8): una sesión del participante, sin datos personales. */
export class SesionParticipanteDtoResponse {
  id_sesion!: string;
  /** Valor del dominio: GRUPAL, PERSONALIZADA o SOS. */
  modalidad!: string;
  /** Valor del dominio: ACTIVA, PAUSADA, COMPLETADA o ERROR_CONFIGURACION. */
  estado!: string;
  fecha_inicio!: string;
  fecha_ultima_interaccion!: string;
}

/** Listado paginado de las sesiones de un participante (solo lectura). */
export class SesionesParticipanteDtoResponse {
  /** Seudónimo A7 consultado; nunca el UUID del estudiante. */
  id_participante!: string;
  items!: SesionParticipanteDtoResponse[];
  /** Total de sesiones del participante, sin paginar. */
  total!: number;
  /** Cursor opaco para la página siguiente, o null si no hay más. */
  siguiente_cursor!: string | null;

  static crear(
    codigoParticipante: string,
    pagina: PaginaSesionesParticipante,
    siguienteCursor: string | null,
  ): SesionesParticipanteDtoResponse {
    return {
      id_participante: codigoParticipante,
      items: pagina.sesiones.map((sesion) => ({
        id_sesion: sesion.idSesion,
        modalidad: sesion.modalidad,
        estado: sesion.estado,
        fecha_inicio: sesion.fechaInicio.toISOString(),
        fecha_ultima_interaccion: sesion.fechaUltimaInteraccion.toISOString(),
      })),
      total: pagina.total,
      siguiente_cursor: siguienteCursor,
    };
  }
}
