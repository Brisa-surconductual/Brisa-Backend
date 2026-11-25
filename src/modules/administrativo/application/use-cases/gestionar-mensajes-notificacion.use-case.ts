import { Injectable } from '@nestjs/common';
import type {
  AccionMensajeNotificacion,
  ActualizarTerminosRestringidos,
  ConsultaMensajesNotificacion,
  CrearMensajeNotificacion,
  EditarMensajeNotificacion,
  ResultadoMensajeNotificacion,
} from '../../domain/results/mensajes-notificacion';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import type { ContextoGestionContenido } from '../../domain/results/contexto-gestion-contenido';
import { GestionContenidoException } from '../exceptions/gestion-contenido.exception';
import { MensajesNotificacionPort } from '../ports/mensajes-notificacion.port';
import { AuditoriaService } from '../services/auditoria.service';

@Injectable()
export class GestionarMensajesNotificacionUseCase {
  constructor(
    private readonly mensajes: MensajesNotificacionPort,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(consulta: ConsultaMensajesNotificacion) {
    return this.mensajes.listar(consulta);
  }

  crear(ctx: ContextoGestionContenido, entrada: CrearMensajeNotificacion) {
    return this.gestionarMensaje(
      ctx,
      'CREAR_MENSAJE',
      () => this.mensajes.crear(ctx.idUsuario, entrada),
      entrada.justificacion_cambio,
    );
  }

  editar(
    ctx: ContextoGestionContenido,
    id: string,
    entrada: EditarMensajeNotificacion,
  ) {
    if (
      entrada.contenido_mensaje === undefined &&
      entrada.tipo_mensaje === undefined
    ) {
      throw new GestionContenidoException('MENSAJE_INCOMPLETO');
    }
    return this.gestionarMensaje(
      ctx,
      'EDITAR_MENSAJE',
      () => this.mensajes.editar(ctx.idUsuario, id, entrada),
      entrada.justificacion_cambio,
    );
  }

  activar(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarMensaje(ctx, 'ACTIVAR_MENSAJE', () =>
      this.mensajes.activar(ctx.idUsuario, id),
    );
  }

  inactivar(ctx: ContextoGestionContenido, id: string) {
    return this.gestionarMensaje(ctx, 'INACTIVAR_MENSAJE', () =>
      this.mensajes.inactivar(ctx.idUsuario, id),
    );
  }

  obtenerTerminos() {
    return this.mensajes.obtenerTerminos();
  }

  actualizarTerminos(
    ctx: ContextoGestionContenido,
    entrada: ActualizarTerminosRestringidos,
  ) {
    return this.auditoria.ejecutarDiferido(
      ctx,
      () => this.mensajes.actualizarTerminos(ctx.idUsuario, entrada),
      () => ({
        accion: AccionAdministrativa.GESTION_MENSAJES_NOTIFICACION,
        recurso: RecursoAuditado.TERMINOS_RESTRINGIDOS,
        detalle: {
          accion_solicitada: 'ACTUALIZAR_TERMINOS_RESTRINGIDOS',
          justificacion_cambio: entrada.justificacion_cambio,
        },
      }),
    );
  }

  private gestionarMensaje(
    ctx: ContextoGestionContenido,
    accion: Exclude<
      AccionMensajeNotificacion,
      'ACTUALIZAR_TERMINOS_RESTRINGIDOS'
    >,
    operacion: () => Promise<ResultadoMensajeNotificacion>,
    justificacion?: string,
  ) {
    return this.auditoria.ejecutarDiferido(ctx, operacion, (resultado) => ({
      accion: AccionAdministrativa.GESTION_MENSAJES_NOTIFICACION,
      recurso: RecursoAuditado.MENSAJE_NOTIFICACION,
      idRecurso: resultado.id_mensaje,
      detalle: {
        accion_solicitada: accion,
        justificacion_cambio: justificacion,
        ...(accion === 'ACTIVAR_MENSAJE' && {
          resultado_validacion_terminos: true,
        }),
      },
    }));
  }
}
