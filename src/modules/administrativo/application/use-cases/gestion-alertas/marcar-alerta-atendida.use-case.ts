import { HttpException, Injectable } from '@nestjs/common';
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
import { RegistroAuditoriaException } from '../../exceptions/registro-auditoria.exception';
import { SeguimientoIndividualException } from '../../exceptions/seguimiento-individual.exception';
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
 * motivo obligatorio. No toca los datos de M05: guarda el estado administrativo
 * en `alertas_gestion_admin`.
 *
 * El registro y su bitácora (GESTION_ALERTA, severidad ALTA) los escribe
 * `fn_atender_alerta` en la misma transacción. Si algo falla, el intento queda
 * en la bitácora como FALLIDA y la alerta conserva su estado.
 */
@Injectable()
export class MarcarAlertaAtendidaUseCase {
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
    codigoParticipante: string,
    idAlerta: string,
    motivo: string,
  ): Promise<AlertaAtendidaDtoResponse> {
    const accion: AccionAuditable = {
      accion: AccionAdministrativa.GESTION_ALERTA,
      recurso: RecursoAuditado.ALERTA_PARTICIPANTE,
      idRecurso: idAlerta,
      severidad: SeveridadAuditoria.ALTA,
      detalle: {
        operacion: 'MARCAR_ATENDIDA',
        id_alerta: idAlerta,
        codigo_participante: codigoParticipante,
      },
    };

    try {
      return await this.transacciones.enTransaccion(async (tx) => {
        const motivoValido = MotivoAtencion.crear(motivo);
        const idParticipante = await this.participantes.buscarIdParticipante(
          tx,
          codigoParticipante,
        );
        if (!idParticipante)
          throw new SeguimientoIndividualException(
            'PARTICIPANTE_NO_ENCONTRADO',
          );
        accion.idParticipante = idParticipante;

        const respuesta = await consultarFuenteConLimite<
          AlertaParticipanteM05 | null | typeof M05_NO_DISPONIBLE
        >(
          () => this.seguimiento.obtenerAlerta(codigoParticipante, idAlerta),
          M05_NO_DISPONIBLE,
        );
        if (respuesta === M05_NO_DISPONIBLE)
          throw new SeguimientoIndividualException('M05_NO_DISPONIBLE');
        if (!respuesta)
          throw new GestionAlertaException('ALERTA_NO_ENCONTRADA');
        this.reglas.validarPertenencia(
          respuesta.codigo_participante,
          codigoParticipante,
        );

        asegurarAlertaAtendible(
          respuesta.alerta.estado_resolucion,
          await this.reglas.estaAtendida(tx, idParticipante, idAlerta),
        );

        const registro = await this.alertas.registrarAtencion(
          tx,
          {
            id_alerta: idAlerta,
            tipo_alerta: respuesta.alerta.tipo_alerta,
            id_participante: idParticipante,
            motivo: motivoValido.valor,
          },
          ctx,
        );
        return {
          id_alerta: idAlerta,
          tipo_alerta: respuesta.alerta.tipo_alerta,
          estado_resolucion: 'ATENDIDA',
          fecha_resolucion: registro.fecha_atencion.toISOString(),
          motivo: motivoValido.valor,
        };
      });
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

  private traducir(error: unknown): HttpException {
    if (error instanceof AdministrativoDomainException)
      return GestionAlertaException.desdeDominio(error);
    // RF-147 FA4: si la auditoría falla, la operación se cancela con su propio mensaje.
    if (error instanceof RegistroAuditoriaException)
      return new GestionAlertaException('ERROR_GESTION_ALERTA', {
        cause: error,
      });
    if (error instanceof HttpException) return error;
    return new GestionAlertaException('ERROR_GESTION_ALERTA', { cause: error });
  }
}
