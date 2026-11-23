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
  { ruta: '/gamificacion', recurso: 'GAMIFICACION' },
  { ruta: '/notificaciones', recurso: 'NOTIFICACIONES' },
] as const;

export function esMetodoDeEscritura(metodo: string): boolean {
  return METODOS_ESCRITURA.has(metodo);
}

export function identificarRecursoParticipante(ruta: string) {
  const rutaNormalizada = ruta.toLowerCase();
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
