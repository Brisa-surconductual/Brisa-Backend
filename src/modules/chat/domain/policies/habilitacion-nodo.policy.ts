import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { HabilitacionContenidoChat } from '../repositories/habilitacion-contenido-chat.repository';

/** RF-24 / RF-22: disponibilidad de un nodo para el estudiante hoy. */
export interface DisponibilidadNodo {
  readonly habilitado: boolean;
  readonly habilitaAprox: Date | null;
}

export const NODO_DISPONIBLE: DisponibilidadNodo = Object.freeze({
  habilitado: true,
  habilitaAprox: null,
});

/**
 * Un nodo sin contenido del cronograma no tiene regla temporal: avanza
 * libre. Con contenido, manda el cronograma (solo bloquea por inicio).
 */
export function requiereHabilitacion(nodo: NodoConversacional): boolean {
  return nodo.idContenido !== null;
}

export function disponibilidadDesde(
  habilitacion: HabilitacionContenidoChat,
): DisponibilidadNodo {
  return habilitacion.habilitado
    ? NODO_DISPONIBLE
    : { habilitado: false, habilitaAprox: habilitacion.fechaHabilitacion };
}
