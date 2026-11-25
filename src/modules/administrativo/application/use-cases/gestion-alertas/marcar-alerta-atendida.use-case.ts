import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AccionAdministrativa } from '../../../domain/enums/accion-administrativa.enum';
import { EstadoAccion } from '../../../domain/enums/estado-accion.enum';
import { RecursoAuditado } from '../../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../../domain/enums/severidad-auditoria.enum';
import { AdministrativoDomainException } from '../../../domain/exceptions/domain.exception';
import { asegurarAlertaAtendible } from '../../../domain/policies/atencion-alerta.policy';
import { AlertasGestionRepository } from '../../../domain/repositories/alertas-gestion.repository';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { MotivoAtencion } from '../../../domain/value-objects/motivo-atencion.vo';
import type { AlertaAtendidaDtoResponse } from '../../dto/gestion-alertas/alerta-atendida.dto-response';
import { GestionAlertaException } from '../../exceptions/gestion-alerta.exception';
import { BitacoraRepository } from '../../ports/auditoria.port';
import {
  type AlertaParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

/**
 * RF-147: el equipo de psicología marca una alerta de M05 como ATENDIDA, con un
 * motivo obligatorio. La alerta se pide a M05 por su id: el tipo y el
 * participante salen de M05, nunca del cliente. No toca los datos de M-2, M-3
 * ni M05: guarda el estado administrativo en `alertas_gestion_admin`.
 *
 * La consulta a M05 va antes de abrir la transacción (no se retiene una
 * transacción mientras se espera la red). Dentro de `$transaction`,
 * `fn_atender_alerta` escribe el registro y su bitácora (GESTION_ALERTA, ALTA);
 * el constraint trigger diferido `trg_alerta_exige_bitacora` es la segunda
 * garantía de que van juntos. Si algo falla, la alerta conserva su estado y el
 * intento queda en la bitácora como FALLIDA.
 */
@Injectable()
export class MarcarAlertaAtendidaUseCase {
  private readonly logger = new Logger(MarcarAlertaAtendidaUseCase.name);

  constructor(
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly participantes: SeguimientoIndividualRepository,
    private readonly alertas: AlertasGestionRepository,
    private readonly transacciones: BitacoraRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  async execute(
    ctx: ContextoAuditoria,
    idAlerta: string,
    motivo: string,
  ): Promise<AlertaAtendidaDtoResponse> {
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.GESTION_ALERTA,
      recurso: RecursoAuditado.ALERTA_PARTICIPANTE,
      idRecurso: idAlerta,
      severidad: SeveridadAuditoria.ALTA,
    };

    try {
      const motivoValido = MotivoAtencion.crear(motivo);
      const { codigo_participante, alerta } = await this.pedirAlerta(idAlerta);
      accion.detalle = {
        operacion: 'MARCAR_ATENDIDA',
        id_alerta: idAlerta,
        codigo_participante,
      };

      const registro = await this.transacciones.enTransaccion(async (tx) => {
        const idParticipante = await this.participantes.buscarIdParticipante(
          tx,
          codigo_participante,
        );
        if (!idParticipante) {
          this.logger.warn(
            `M05 atribuye la alerta ${idAlerta} a un participante que no existe en M-8.`,
          );
          throw new GestionAlertaException('ALERTA_NO_ENCONTRADA');
        }
        accion.idParticipante = idParticipante;

        asegurarAlertaAtendible(
          alerta.estado_resolucion,
          await this.reglas.estaAtendida(tx, idParticipante, idAlerta),
        );
        return this.alertas.registrarAtencion(
          tx,
          {
            id_alerta: idAlerta,
            tipo_alerta: alerta.tipo_alerta,
            id_participante: idParticipante,
            motivo: motivoValido.valor,
          },
          ctx,
        );
      });

      return {
        id_alerta: idAlerta,
        estado: 'ATENDIDA',
        fecha_atencion: registro.fecha_atencion.toISOString(),
      };
    } catch (error) {
      const traducido = this.traducir(error);
      const status = traducido.getStatus();
      await this.auditoria.registrarIntento(
        ctx,
        accion,
        status === 401 || status === 403
          ? EstadoAccion.DENEGADA
          : EstadoAccion.FALLIDA,
      );
      throw traducido;
    }
  }

  /** La alerta tal como la conoce M05: 503 si no responde, 404 si no existe. */
  private async pedirAlerta(idAlerta: string): Promise<AlertaParticipanteM05> {
    const respuesta = await consultarFuenteConLimite<
      AlertaParticipanteM05 | null | typeof M05_NO_DISPONIBLE
    >(() => this.seguimiento.buscarAlerta(idAlerta), M05_NO_DISPONIBLE);
    if (respuesta === M05_NO_DISPONIBLE)
      throw new GestionAlertaException('M05_NO_DISPONIBLE');
    // M05 debe responder por la alerta pedida, no por otra.
    if (
      !respuesta ||
      respuesta.alerta.id_alerta.toLowerCase() !== idAlerta.toLowerCase()
    )
      throw new GestionAlertaException('ALERTA_NO_ENCONTRADA');
    return respuesta;
  }

  private traducir(error: unknown): HttpException {
    if (error instanceof AdministrativoDomainException)
      return GestionAlertaException.desdeDominio(error);
    // Incluye el fallo de la auditoría (RegistroAuditoriaException) y cualquier
    // error de la transacción: la alerta conserva su estado.
    if (error instanceof HttpException && error.getStatus() < 500) return error;
    if (error instanceof GestionAlertaException) return error;
    return new GestionAlertaException('ERROR_TRANSACCION', { cause: error });
  }
}
