import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
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
  async filtrarNoAtendidas(tx: Prisma.TransactionClient, idsAlerta: string[]) {
    // Un id que no es UUID nunca se atendió en M-8 (y haría fallar el cast).
    const candidatas = [...new Set(idsAlerta.map((id) => id.toLowerCase()))];
    const validas = candidatas.filter((id) => isUUID(id));
    const noAtendidas = new Set(candidatas.filter((id) => !isUUID(id)));
    if (validas.length === 0) return noAtendidas;
    const filas = await tx.$queryRaw<{ id: string }[]>`
      SELECT a.id::text AS id
      FROM unnest(${validas}::uuid[]) AS a(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM administrativo.alertas_gestion_admin g
        WHERE g.id_alerta_externo = a.id
      )
    `;
    for (const fila of filas) noAtendidas.add(fila.id.toLowerCase());
    return noAtendidas;
  }

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
      if (!fila) throw new GestionAlertaException('ERROR_TRANSACCION');
      return fila;
    } catch (error) {
      if (error instanceof GestionAlertaException) throw error;
      const db = errorSqlPrisma(error);
      const codigo = ERRORES_SQL.find(
        ([estado, mensaje]) =>
          db?.estado === estado && (mensaje === null || db.mensaje === mensaje),
      )?.[2];
      throw new GestionAlertaException(codigo ?? 'ERROR_TRANSACCION', {
        cause: error,
      });
    }
  }
}
