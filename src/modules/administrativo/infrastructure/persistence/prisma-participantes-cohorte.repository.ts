import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CohorteException } from '../../application/exceptions/cohorte.exception';
import { ParticipanteCohorteException } from '../../application/exceptions/participante-cohorte.exception';
import { ParticipantesCohorteRepository } from '../../domain/repositories/participantes-cohorte.repository';
import type { ParticipanteCohorte } from '../../domain/entities/participante-cohorte/participante-cohorte.entity';
import type { EstadoCohorte } from '../../domain/enums/estado-cohorte.enum';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { errorSqlPrisma } from '../expetions/error-sql-prisma';

const ERRORES_SQL = {
  COHORTE_NO_ACTIVA: 'AD422',
  PARTICIPANTE_NO_ENCONTRADO: 'AD404',
  PARTICIPANTE_NO_ASIGNADO: 'AD404',
  PARTICIPANTE_YA_ASIGNADO: 'AD409',
  PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA: 'AD409',
  PARTICIPANTE_NO_CUMPLE_REQUISITOS: 'AD422',
} as const;

@Injectable()
export class PrismaParticipantesCohorteRepository implements ParticipantesCohorteRepository {
  async estadoCohorte(
    tx: Prisma.TransactionClient,
    cohorte: string,
    bloquear: boolean,
  ) {
    const [fila] = await this.consultar<{ estado: EstadoCohorte }>(
      tx,
      Prisma.sql`
      SELECT estado::text
      FROM administrativo.cohortes
      WHERE id_cohorte = ${cohorte}::uuid AND fecha_eliminacion IS NULL
      ${bloquear ? Prisma.sql`FOR SHARE` : Prisma.empty}
    `,
    );
    return fila?.estado ?? null;
  }

  listar(tx: Prisma.TransactionClient, cohorte: string, codigos?: string[]) {
    const filtro = codigos
      ? Prisma.sql`AND codigo_participante IN (${Prisma.join(codigos)})`
      : Prisma.empty;
    return this.consultar<ParticipanteCohorte>(
      tx,
      Prisma.sql`
      SELECT codigo_participante, estado::text, estado_registro, estado_consentimiento, estado_linea_base,
        CASE WHEN estado = 'PENDIENTE_VALIDACION'
          THEN administrativo.fn_motivos_pendiente_participante(estado_registro, estado_consentimiento, estado_linea_base)
          ELSE ARRAY[]::text[]
        END AS motivos_pendiente
      FROM administrativo.v_cohorte_participantes_validacion
      WHERE id_cohorte = ${cohorte}::uuid ${filtro}
      ORDER BY codigo_participante
    `,
    );
  }

  listarActivos(tx: Prisma.TransactionClient, cohorte: string) {
    // Directo sobre las tablas (índice ix_membresia_cohorte_estado): la vista de
    // validación calcula un LATERAL por fila que el listado no necesita.
    return this.consultar<{ id_usuario: string; codigo_participante: string }>(
      tx,
      Prisma.sql`
      SELECT cp.id_usuario::text AS id_usuario, s.codigo_participante
      FROM administrativo.cohorte_participantes cp
      JOIN administrativo.seudonimos_participante s ON s.id_usuario = cp.id_usuario
      WHERE cp.id_cohorte = ${cohorte}::uuid AND cp.estado = 'ACTIVO'
      ORDER BY s.codigo_participante
    `,
    );
  }

  listarElegibles(tx: Prisma.TransactionClient, cohorte: string) {
    return this.consultar<{ codigo_participante: string }>(
      tx,
      Prisma.sql`
      WITH candidatos AS MATERIALIZED (
        SELECT u.id_usuario
        FROM usuario.usuarios u
        WHERE u.rol = 'ESTUDIANTE'
          AND NOT EXISTS (
            SELECT 1 FROM administrativo.cohorte_participantes cp
            WHERE cp.id_usuario = u.id_usuario AND cp.id_cohorte = ${cohorte}::uuid
              AND cp.estado <> 'INACTIVO'
          )
          AND NOT administrativo.fn_membresia_en_otra_cohorte_activa(${cohorte}::uuid, u.id_usuario)
        ORDER BY u.id_usuario
      )
      SELECT administrativo.fn_obtener_codigo_participante(id_usuario) AS codigo_participante
      FROM candidatos
      ORDER BY codigo_participante
    `,
    );
  }

  async asignar(
    tx: Prisma.TransactionClient,
    cohorte: string,
    codigos: string[],
    actor: ContextoAuditoria,
  ) {
    const participantes = await this.consultar<{
      id_usuario: string;
      codigo_participante: string;
    }>(
      tx,
      Prisma.sql`
      SELECT s.id_usuario, s.codigo_participante
      FROM administrativo.seudonimos_participante s
      JOIN usuario.usuarios u ON u.id_usuario = s.id_usuario AND u.rol = 'ESTUDIANTE'
      WHERE s.codigo_participante IN (${Prisma.join(codigos)})
      ORDER BY s.id_usuario
    `,
    );
    if (participantes.length !== codigos.length) {
      throw new ParticipanteCohorteException('PARTICIPANTE_NO_ENCONTRADO');
    }

    // La función toma un bloqueo por usuario. El orden evita interbloqueos entre lotes.
    for (const participante of participantes) {
      await this.consultar(
        tx,
        Prisma.sql`
        SELECT r_id_cohorte_participante
        FROM administrativo.fn_asignar_participante(
          ${cohorte}::uuid, ${participante.id_usuario}::uuid, ${actor.idUsuario}::uuid,
          ${actor.idSesion}::uuid, ${actor.direccionIp}::varchar
        )
      `,
        participante.codigo_participante,
      );
    }
    const asignados = await this.listar(tx, cohorte, codigos);
    if (asignados.length !== codigos.length) {
      throw new ParticipanteCohorteException(
        'ERROR_PERSISTENCIA_PARTICIPANTES',
      );
    }
    return asignados;
  }

  async retirar(
    tx: Prisma.TransactionClient,
    cohorte: string,
    codigo: string,
    actor: ContextoAuditoria,
  ) {
    await this.consultar(
      tx,
      Prisma.sql`
      SELECT administrativo.fn_retirar_participante(
        ${cohorte}::uuid, ${codigo}::varchar, ${actor.idUsuario}::uuid,
        ${actor.idSesion}::uuid, ${actor.direccionIp}::varchar
      )
    `,
    );
    const [retirado] = await this.listar(tx, cohorte, [codigo]);
    if (!retirado)
      throw new ParticipanteCohorteException(
        'ERROR_PERSISTENCIA_PARTICIPANTES',
      );
    return retirado;
  }

  private async consultar<T>(
    tx: Prisma.TransactionClient,
    consulta: Prisma.Sql,
    codigoParticipante?: string,
  ): Promise<T[]> {
    try {
      return await tx.$queryRaw<T[]>(consulta);
    } catch (error) {
      const db = errorSqlPrisma(error);
      if (db?.estado === 'AD404' && db.mensaje === 'COHORTE_NO_ENCONTRADA') {
        throw new CohorteException('COHORTE_NO_ENCONTRADA');
      }
      for (const [codigo, estado] of Object.entries(ERRORES_SQL) as [
        keyof typeof ERRORES_SQL,
        string,
      ][]) {
        if (db?.estado === estado && db.mensaje === codigo)
          throw new ParticipanteCohorteException(codigo, {
            codigoParticipante,
          });
      }
      throw new ParticipanteCohorteException(
        'ERROR_PERSISTENCIA_PARTICIPANTES',
        {
          cause: error,
        },
      );
    }
  }
}
