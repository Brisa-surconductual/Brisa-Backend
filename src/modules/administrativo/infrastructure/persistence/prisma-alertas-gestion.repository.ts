import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  type CodigoErrorGestionAlerta,
  GestionAlertaException,
} from '../../application/exceptions/gestion-alerta.exception';
import {
  AlertasGestionRepository,
  type NuevaAtencionAlerta,
} from '../../domain/repositories/alertas-gestion.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { errorSqlPrisma } from '../expetions/error-sql-prisma';

/** SQLSTATE / mensaje de la base -> código de error de RF-147. */
const ERRORES_SQL: [string, string | null, CodigoErrorGestionAlerta][] = [
  ['AD409', 'ALERTA_YA_ATENDIDA', 'ALERTA_YA_ATENDIDA'],
  ['23505', null, 'ALERTA_YA_ATENDIDA'],
  ['AD422', 'MOTIVO_OBLIGATORIO', 'MOTIVO_INVALIDO'],
  // ck_alerta_motivo: longitud fuera de 10..500.
  ['23514', null, 'MOTIVO_INVALIDO'],
];

@Injectable()
export class PrismaAlertasGestionRepository implements AlertasGestionRepository {
  async registrarAtencion(
    tx: Prisma.TransactionClient,
    atencion: NuevaAtencionAlerta,
    actor: ContextoAuditoria,
  ) {
    try {
      const [fila] = await tx.$queryRaw<
        { id_alerta_gestion: string; fecha_atencion: Date }[]
      >`
        SELECT r_id_alerta_gestion AS id_alerta_gestion, r_fecha_atencion AS fecha_atencion
        FROM administrativo.fn_atender_alerta(
          ${atencion.id_alerta}::uuid,
          ${atencion.tipo_alerta}::administrativo.tipo_alerta_enum,
          ${atencion.id_participante}::uuid,
          ${atencion.motivo}::text,
          ${actor.idUsuario}::uuid,
          ${actor.idSesion}::uuid,
          ${actor.direccionIp}::varchar
        )
      `;
      if (!fila) throw new GestionAlertaException('ERROR_GESTION_ALERTA');
      return fila;
    } catch (error) {
      if (error instanceof GestionAlertaException) throw error;
      const db = errorSqlPrisma(error);
      const codigo = ERRORES_SQL.find(
        ([estado, mensaje]) =>
          db?.estado === estado && (mensaje === null || db.mensaje === mensaje),
      )?.[2];
      throw new GestionAlertaException(codigo ?? 'ERROR_GESTION_ALERTA', {
        cause: error,
      });
    }
  }
}
