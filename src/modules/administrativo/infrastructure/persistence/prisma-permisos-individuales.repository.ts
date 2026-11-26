import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  type CodigoErrorPermisoIndividual,
  PermisoIndividualException,
} from '../../application/exceptions/permiso-individual.exception';
import { PermisoIndividual } from '../../domain/entities/permiso-individual/permiso-individual.entity';
import type { AlcancePermiso } from '../../domain/enums/alcance-permiso.enum';
import { PermisosIndividualesRepository } from '../../domain/repositories/permisos-individuales.repository';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import type { FiltroPermisosIndividuales } from '../../domain/results/filtro-permisos-individuales';
import type { NuevoPermisoIndividual } from '../../domain/results/nuevo-permiso-individual';
import { errorSqlPrisma } from '../expetions/error-sql-prisma';

interface FilaPermiso {
  id_permiso: string;
  id_usuario_beneficiario: string;
  id_participante: string;
  codigo_participante: string;
  alcance: AlcancePermiso;
  fecha_inicio_vigencia: Date;
  fecha_fin_vigencia: Date | null;
  revocado_en: Date | null;
}

/** SQLSTATE / mensaje de la base -> código de error del contrato RF-04. */
const ERRORES_SQL: [string, string | null, CodigoErrorPermisoIndividual][] = [
  // Índice único parcial uq_permiso_individual_no_revocado (equivalente a P2002).
  ['23505', null, 'PERMISO_YA_VIGENTE'],
  ['AD422', 'ROL_INVALIDO', 'ROL_INVALIDO_PARA_OPERACION'],
  ['AD422', 'AUTOCONCESION_NO_PERMITIDA', 'AUTOCONCESION_NO_PERMITIDA'],
  ['AD409', 'PERMISO_YA_REVOCADO', 'PERMISO_YA_REVOCADO'],
  // ck_permiso_vigencia: fin <= inicio.
  ['23514', null, 'VIGENCIA_INVALIDA'],
];

const COLUMNAS = Prisma.sql`
  p.id_permiso, p.id_usuario_administrativo AS id_usuario_beneficiario, p.id_participante,
  s.codigo_participante, p.alcance::text AS alcance, p.fecha_inicio_vigencia,
  p.fecha_fin_vigencia, p.revocado_en`;

const VIGENTE = Prisma.sql`(p.revocado_en IS NULL AND p.fecha_inicio_vigencia <= now()
  AND (p.fecha_fin_vigencia IS NULL OR p.fecha_fin_vigencia > now()))`;

const aEntidad = (fila: FilaPermiso) =>
  new PermisoIndividual({
    id_permiso: fila.id_permiso,
    id_usuario_beneficiario: fila.id_usuario_beneficiario,
    codigo_participante: fila.codigo_participante,
    alcance: fila.alcance,
    fecha_inicio_vigencia: fila.fecha_inicio_vigencia,
    fecha_fin_vigencia: fila.fecha_fin_vigencia,
    revocado_en: fila.revocado_en,
  });

@Injectable()
export class PrismaPermisosIndividualesRepository implements PermisosIndividualesRepository {
  async buscarIdParticipante(tx: Prisma.TransactionClient, codigo: string) {
    const [fila] = await this.consultar<{ id_usuario: string }>(
      tx,
      Prisma.sql`
      SELECT s.id_usuario
      FROM administrativo.seudonimos_participante s
      JOIN usuario.usuarios u ON u.id_usuario = s.id_usuario AND u.rol = 'ESTUDIANTE'
      WHERE s.codigo_participante = ${codigo}
    `,
    );
    return fila?.id_usuario ?? null;
  }

  async cerrarVencidos(
    tx: Prisma.TransactionClient,
    beneficiario: string,
    participante: string,
    alcance: AlcancePermiso,
    actor: ContextoAuditoria,
  ) {
    await this.consultar(
      tx,
      Prisma.sql`
      SELECT administrativo.fn_cerrar_permisos_vencidos(
        ${beneficiario}::uuid, ${participante}::uuid,
        ${alcance}::administrativo.alcance_permiso_enum,
        ${actor.idUsuario}::uuid, ${actor.idSesion}::uuid, ${actor.direccionIp}::varchar
      )
    `,
    );
  }

  async otorgar(tx: Prisma.TransactionClient, permiso: NuevoPermisoIndividual) {
    const [fila] = await this.consultar<FilaPermiso>(
      tx,
      Prisma.sql`
      WITH p AS (
        INSERT INTO administrativo.permisos_acceso_individual
          (id_permiso, id_usuario_administrativo, id_participante, alcance, fecha_fin_vigencia, otorgado_por)
        VALUES (
          ${permiso.id_permiso}::uuid, ${permiso.id_usuario_beneficiario}::uuid,
          ${permiso.id_participante}::uuid, ${permiso.alcance}::administrativo.alcance_permiso_enum,
          ${permiso.fecha_fin_vigencia}::timestamptz, ${permiso.otorgado_por}::uuid
        )
        RETURNING *
      )
      SELECT ${COLUMNAS}
      FROM p JOIN administrativo.seudonimos_participante s ON s.id_usuario = p.id_participante
    `,
    );
    if (!fila)
      throw new PermisoIndividualException('ERROR_PERSISTENCIA_PERMISOS');
    return aEntidad(fila);
  }

  async listar(
    tx: Prisma.TransactionClient,
    filtro: FiltroPermisosIndividuales,
  ) {
    const condiciones = [
      filtro.codigo_participante
        ? Prisma.sql`s.codigo_participante = ${filtro.codigo_participante}`
        : null,
      filtro.solo_vigentes ? VIGENTE : null,
    ].filter((c): c is Prisma.Sql => c !== null);
    const donde = condiciones.length
      ? Prisma.sql`WHERE ${Prisma.join(condiciones, ' AND ')}`
      : Prisma.empty;
    const base = Prisma.sql`
      FROM administrativo.permisos_acceso_individual p
      JOIN administrativo.seudonimos_participante s ON s.id_usuario = p.id_participante`;

    // El conteo no necesita el JOIN con usuarios: la FK del beneficiario garantiza que la fila existe.
    const [conteo] = await this.consultar<{ total: number; ahora: Date }>(
      tx,
      Prisma.sql`SELECT count(*)::int AS total, now() AS ahora ${base} ${donde}`,
    );
    // Una sola consulta para las filas y el correo del beneficiario (sin N+1).
    const filas = await this.consultar<
      FilaPermiso & { correo_beneficiario: string }
    >(
      tx,
      Prisma.sql`
      SELECT ${COLUMNAS}, b.correo_electronico AS correo_beneficiario ${base}
      JOIN usuario.usuarios b ON b.id_usuario = p.id_usuario_administrativo
      ${donde}
      ORDER BY p.fecha_creacion DESC, p.id_permiso
      OFFSET ${filtro.offset} LIMIT ${filtro.limit}
    `,
    );
    return {
      items: filas.map((fila) => ({
        permiso: aEntidad(fila),
        correo_beneficiario: fila.correo_beneficiario,
      })),
      total: conteo?.total ?? 0,
      ahora: conteo?.ahora ?? new Date(),
    };
  }

  async buscarPorId(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear: boolean,
  ) {
    const [fila] = await this.consultar<FilaPermiso>(
      tx,
      Prisma.sql`
      SELECT ${COLUMNAS}
      FROM administrativo.permisos_acceso_individual p
      JOIN administrativo.seudonimos_participante s ON s.id_usuario = p.id_participante
      WHERE p.id_permiso = ${id}::uuid
      ${bloquear ? Prisma.sql`FOR UPDATE OF p` : Prisma.empty}
    `,
    );
    return fila
      ? { permiso: aEntidad(fila), id_participante: fila.id_participante }
      : null;
  }

  async revocar(tx: Prisma.TransactionClient, id: string) {
    const [fila] = await this.consultar<FilaPermiso>(
      tx,
      Prisma.sql`
      WITH p AS (
        UPDATE administrativo.permisos_acceso_individual
        SET revocado_en = now()
        WHERE id_permiso = ${id}::uuid
        RETURNING *
      )
      SELECT ${COLUMNAS}
      FROM p JOIN administrativo.seudonimos_participante s ON s.id_usuario = p.id_participante
    `,
    );
    if (!fila) throw new PermisoIndividualException('PERMISO_NO_ENCONTRADO');
    return aEntidad(fila);
  }

  async tieneVigente(
    tx: Prisma.TransactionClient,
    beneficiario: string,
    participante: { codigo: string } | { idSesion: string },
    alcance: AlcancePermiso,
  ) {
    const origen =
      'codigo' in participante
        ? Prisma.sql`
          SELECT s.id_usuario FROM administrativo.seudonimos_participante s
          WHERE s.codigo_participante = ${participante.codigo}`
        : Prisma.sql`
          SELECT cs.id_usuario FROM chat.sesiones cs
          WHERE cs.id_sesion = ${participante.idSesion}::uuid`;
    const [fila] = await this.consultar<{ vigente: boolean }>(
      tx,
      Prisma.sql`
      SELECT administrativo.fn_permiso_individual_vigente(
        ${beneficiario}::uuid, o.id_usuario, ${alcance}::administrativo.alcance_permiso_enum
      ) AS vigente
      FROM (${origen}) o
    `,
    );
    return fila?.vigente === true;
  }

  private async consultar<T>(
    tx: Prisma.TransactionClient,
    consulta: Prisma.Sql,
  ): Promise<T[]> {
    try {
      return await tx.$queryRaw<T[]>(consulta);
    } catch (error) {
      if (error instanceof PermisoIndividualException) throw error;
      const db = errorSqlPrisma(error);
      const codigo = ERRORES_SQL.find(
        ([estado, mensaje]) =>
          db?.estado === estado && (mensaje === null || db.mensaje === mensaje),
      )?.[2];
      throw new PermisoIndividualException(
        codigo ?? 'ERROR_PERSISTENCIA_PERMISOS',
        { cause: error },
      );
    }
  }
}
