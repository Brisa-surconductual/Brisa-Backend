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
});
