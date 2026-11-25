import {
  esMetodoDeEscritura,
  identificarRecursoParticipante,
} from './recursos-de-participante';

describe('Recursos de participante RF-148', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'clasifica %s como escritura',
    (metodo) => expect(esMetodoDeEscritura(metodo)).toBe(true),
  );

  it.each(['GET', 'HEAD', 'OPTIONS'])('deja pasar el método %s', (metodo) =>
    expect(esMetodoDeEscritura(metodo)).toBe(false),
  );

  it.each([
    ['/diario', 'DIARIO'],
    ['/seguimiento', 'SEGUIMIENTO'],
    ['/admin/participantes/P-7F3A91C2/alertas', 'SEGUIMIENTO'],
    ['/gamificacion', 'GAMIFICACION'],
    ['/notificaciones', 'NOTIFICACIONES'],
    ['/chat/sesiones/iniciar', 'CHAT_SESION'],
    ['/chat/sos/activar', 'CHAT_SOS'],
    ['/chat/errores-cliente', 'CHAT_ERRORES_CLIENTE'],
    ['/chat/me/contenidos-vigentes', 'CHAT_CONTENIDO'],
  ])('identifica %s como %s', (ruta, recurso) => {
    expect(identificarRecursoParticipante(ruta)).toEqual({
      recurso,
      idRecurso: null,
    });
  });

  it('identifica una sesión incluso con mayúsculas y barra final', () => {
    const idRecurso = 'a3fe9435-1498-490d-8cb1-7e6f0a80a833';
    expect(
      identificarRecursoParticipante(`/CHAT/SESIONES/${idRecurso}/respuestas/`),
    ).toEqual({ recurso: 'CHAT_SESION', idRecurso });
  });

  it.each([
    '/diario-programa',
    '/chat/sesiones-demo',
    '/chat/admin/flujos',
    '/chat/admin/modalidad/habilitar-personalizada',
    '/chat/administracion/arboles-personalizados',
    '/chat/taxonomia-variables',
    '/administrativo/cohortes',
    '/administrativo/configuracion',
    '/cronograma/crear',
  ])('mantiene fuera del bloqueo %s', (ruta) => {
    expect(identificarRecursoParticipante(ruta)).toBeNull();
  });

  it('permite la acción administrativa de RF-147 sobre una alerta', () => {
    expect(
      identificarRecursoParticipante(
        '/admin/participantes/P-7F3A91C2/alertas/1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d/atender',
      ),
    ).toBeNull();
  });

  it.each([
    [
      '/admin/participantes/P-7F3A91C2/progresion-narrativa',
      'GAMIFICACION',
      'La consulta de progresión narrativa individual es de solo lectura.',
    ],
    [
      '/ADMIN/participantes/p-7f3a91c2/progresion-narrativa/logros/',
      'GAMIFICACION',
      'La consulta de progresión narrativa individual es de solo lectura.',
    ],
    [
      '/admin/participantes/P-7F3A91C2/interaccion-notificaciones',
      'NOTIFICACIONES',
      'La consulta del historial de interacción con notificaciones es de solo lectura.',
    ],
  ])(
    'protege %s como %s con el mensaje de RF-130 / RF-131',
    (ruta, recurso, mensaje) => {
      expect(identificarRecursoParticipante(ruta)).toEqual({
        recurso,
        idRecurso: null,
        mensaje,
      });
    },
  );

  it('sigue protegiendo las demás rutas de seguimiento individual', () => {
    expect(
      identificarRecursoParticipante(
        '/admin/participantes/P-7F3A91C2/alertas/1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d',
      ),
    ).toEqual({ recurso: 'SEGUIMIENTO', idRecurso: null });
  });
});
