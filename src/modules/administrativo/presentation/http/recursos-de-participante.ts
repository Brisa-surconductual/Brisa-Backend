import { isUUID } from 'class-validator';

const METODOS_ESCRITURA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const RECURSOS_DE_PARTICIPANTE = [
  { ruta: '/diario', recurso: 'DIARIO' },
  { ruta: '/chat/sesiones', recurso: 'CHAT_SESION', recursoEnRuta: true },
  { ruta: '/chat/admin/sesiones', recurso: 'CHAT_SESION', recursoEnRuta: true },
  { ruta: '/chat/me', recurso: 'CHAT_CONTENIDO' },
  { ruta: '/chat/sos', recurso: 'CHAT_SOS', recursoEnRuta: true },
  { ruta: '/chat/errores-cliente', recurso: 'CHAT_ERRORES_CLIENTE' },
  { ruta: '/seguimiento', recurso: 'SEGUIMIENTO' },
  // RF-128 / RF-129: el seguimiento individual en M-8 es de solo lectura.
  { ruta: '/admin/participantes', recurso: 'SEGUIMIENTO' },
  { ruta: '/gamificacion', recurso: 'GAMIFICACION' },
  { ruta: '/notificaciones', recurso: 'NOTIFICACIONES' },
] as const;

/**
 * RF-130 / RF-131: vistas individuales de solo lectura con su propio mensaje
 * para el 403 (flujo alterno "Intento de modificación desde modo solo lectura").
 */
const VISTAS_INDIVIDUALES_SOLO_LECTURA = [
  {
    patron: /^\/admin\/participantes\/[^/]+\/progresion-narrativa(?:\/.*)?$/u,
    recurso: 'GAMIFICACION',
    mensaje:
      'La consulta de progresión narrativa individual es de solo lectura.',
  },
  {
    patron:
      /^\/admin\/participantes\/[^/]+\/interaccion-notificaciones(?:\/.*)?$/u,
    recurso: 'NOTIFICACIONES',
    mensaje:
      'La consulta del historial de interacción con notificaciones es de solo lectura.',
  },
] as const;

export interface RecursoParticipante {
  recurso: string;
  idRecurso: string | null;
  /** Mensaje propio del 403; si falta, el middleware usa el genérico. */
  mensaje?: string;
}

export function esMetodoDeEscritura(metodo: string): boolean {
  return METODOS_ESCRITURA.has(metodo);
}

export function identificarRecursoParticipante(
  ruta: string,
): RecursoParticipante | null {
  const rutaNormalizada = ruta.toLowerCase();
  const vista = VISTAS_INDIVIDUALES_SOLO_LECTURA.find(({ patron }) =>
    patron.test(rutaNormalizada),
  );
  if (vista)
    return { recurso: vista.recurso, idRecurso: null, mensaje: vista.mensaje };
  const coincidencia = RECURSOS_DE_PARTICIPANTE.find(
    ({ ruta: prefijo }) =>
      rutaNormalizada === prefijo || rutaNormalizada.startsWith(prefijo + '/'),
  );
  if (!coincidencia) return null;

  const segmento = rutaNormalizada
    .slice(coincidencia.ruta.length + 1)
    .split('/')[0];
  return {
    recurso: coincidencia.recurso,
    idRecurso:
      'recursoEnRuta' in coincidencia && isUUID(segmento) ? segmento : null,
  };
}
