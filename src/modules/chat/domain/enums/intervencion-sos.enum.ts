/** RF-43: estado de una intervención SOS (chat.estado_intervencion_sos_enum). */
export enum EstadoIntervencionSos {
  EN_CURSO = 'EN_CURSO',
  COMPLETA = 'COMPLETA',
  INCOMPLETA = 'INCOMPLETA',
  EXPIRADA = 'EXPIRADA',
}

/** RF-43: estado de la sesión de terapia al activar el SOS. */
export enum EstadoSesionAnteriorSos {
  ACTIVA = 'ACTIVA',
  PAUSADA = 'PAUSADA',
  NINGUNA = 'NINGUNA',
}

/** RF-43: motivo con el que el cliente finaliza la intervención. */
export enum MotivoFinalizacionSos {
  COMPLETADA = 'COMPLETADA',
  CERRADA_POR_USUARIO = 'CERRADA_POR_USUARIO',
  TIEMPO_AGOTADO = 'TIEMPO_AGOTADO',
}

/** Ampliación B: módulo desde el que se oprimió el botón SOS. */
export enum ModuloOrigenSos {
  CHAT = 'CHAT',
  DIARIO = 'DIARIO',
  CRONOGRAMA = 'CRONOGRAMA',
  CONTENIDO = 'CONTENIDO',
  PERFIL = 'PERFIL',
  OTRO = 'OTRO',
}

/** RF-43, restricción 5: el SOS registra siempre el nivel máximo de craving. */
export const NIVEL_CRAVING_SOS = 5;
