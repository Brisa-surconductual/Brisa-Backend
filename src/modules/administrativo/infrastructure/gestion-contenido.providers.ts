import type { Provider } from '@nestjs/common';
import { GestionContenidoException } from '../application/exceptions/gestion-contenido.exception';
import { ContenidoNarrativoPort } from '../application/ports/contenido-narrativo.port';
import { MensajesNotificacionPort } from '../application/ports/mensajes-notificacion.port';

const notificacionesNoDisponibles = () =>
  Promise.reject(
    new GestionContenidoException('MODULO_NOTIFICACIONES_NO_DISPONIBLE'),
  );
const narrativaNoDisponible = () =>
  Promise.reject(
    new GestionContenidoException('MODULO_NARRATIVO_NO_DISPONIBLE'),
  );

/** Vinculaciones provisionales hasta que M-7 y M-6 exporten sus casos de uso. */
export const GestionContenidoInfrastructureProviders: Provider[] = [
  {
    provide: MensajesNotificacionPort,
    useValue: {
      listar: notificacionesNoDisponibles,
      crear: notificacionesNoDisponibles,
      editar: notificacionesNoDisponibles,
      activar: notificacionesNoDisponibles,
      inactivar: notificacionesNoDisponibles,
      obtenerTerminos: notificacionesNoDisponibles,
      actualizarTerminos: notificacionesNoDisponibles,
    } satisfies MensajesNotificacionPort,
  },
  {
    provide: ContenidoNarrativoPort,
    useValue: {
      listarCapitulos: narrativaNoDisponible,
      crearCapitulo: narrativaNoDisponible,
      editarCapitulo: narrativaNoDisponible,
      publicarCapitulo: narrativaNoDisponible,
      inactivarCapitulo: narrativaNoDisponible,
      listarLogros: narrativaNoDisponible,
      crearLogro: narrativaNoDisponible,
      editarLogro: narrativaNoDisponible,
      activarLogro: narrativaNoDisponible,
      inactivarLogro: narrativaNoDisponible,
      guardarReglaNivel: narrativaNoDisponible,
      consultarCobertura: narrativaNoDisponible,
    } satisfies ContenidoNarrativoPort,
  },
];
