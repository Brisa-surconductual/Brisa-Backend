import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  AuditoriaAdministrativaPort,
  EventoAuditoriaAdministrativa,
} from '../../application/ports/auditoria-administrativa.port';

/**
 * Adaptador de RF-123 sobre la función existente
 * administrativo.fn_registrar_auditoria (migración M-8, sección 17.1). No crea
 * tablas ni escribe directamente en la bitácora; la inmutabilidad la garantizan
 * los triggers trg_bitacora_inmutable y trg_bitacora_no_truncate.
 *
 * La severidad no se envía: RF-123 no la define para estas consultas y se
 * aplica el valor por defecto de la función.
 */
@Injectable()
export class PrismaAuditoriaAdministrativaAdapter extends AuditoriaAdministrativaPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async registrar(evento: EventoAuditoriaAdministrativa): Promise<string> {
    const filas = await this.prisma.$queryRaw<{ id_auditoria: string }[]>`
      SELECT administrativo.fn_registrar_auditoria(
        p_id_admin => ${evento.actor.idUsuario}::uuid,
        p_id_sesion => ${evento.actor.idSesionAutenticacion}::uuid,
        p_accion => ${evento.accion}::administrativo.accion_admin_enum,
        p_recurso => ${evento.recursoAfectado}::varchar,
        p_id_recurso => ${evento.idRecurso}::uuid,
        p_id_participante => ${evento.idParticipante}::uuid,
        p_ip => ${evento.actor.direccionIp}::varchar,
        p_estado => ${evento.estado}::administrativo.estado_accion_enum,
        p_detalle => ${JSON.stringify(evento.detalle)}::jsonb,
        p_diferido => false
      )::text AS id_auditoria`;
    const id = filas[0]?.id_auditoria;
    if (typeof id !== 'string' || id.length === 0)
      throw new Error('La bitácora no devolvió el identificador del registro.');
    return id;
  }
}
