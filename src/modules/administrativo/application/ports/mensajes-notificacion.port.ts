import type {
  ActualizarTerminosRestringidos,
  ConsultaMensajesNotificacion,
  CrearMensajeNotificacion,
  EditarMensajeNotificacion,
  PaginaMensajesNotificacion,
  ResultadoMensajeNotificacion,
  TerminosRestringidos,
} from '../../domain/results/mensajes-notificacion';

export abstract class MensajesNotificacionPort {
  abstract listar(
    consulta: ConsultaMensajesNotificacion,
  ): Promise<PaginaMensajesNotificacion>;
  abstract crear(
    actor: string,
    entrada: CrearMensajeNotificacion,
  ): Promise<ResultadoMensajeNotificacion>;
  /** RF-85 vuelve a validar si la edición mantiene un mensaje activo. */
  abstract editar(
    actor: string,
    id: string,
    entrada: EditarMensajeNotificacion,
  ): Promise<ResultadoMensajeNotificacion>;
  /** M-7 valida la lista vigente de RF-85 y activa en una sola operación. */
  abstract activar(
    actor: string,
    id: string,
  ): Promise<ResultadoMensajeNotificacion>;
  abstract inactivar(
    actor: string,
    id: string,
  ): Promise<ResultadoMensajeNotificacion>;
  abstract obtenerTerminos(): Promise<TerminosRestringidos>;
  /** RF-85 usa la lista nueva en validaciones futuras. */
  abstract actualizarTerminos(
    actor: string,
    entrada: ActualizarTerminosRestringidos,
  ): Promise<TerminosRestringidos>;
}
