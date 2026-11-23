import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CodigoErrorCohorte } from '../../application/cohorte.errors';
import { errorCohorte } from '../../application/cohorte.errors';
import { CohortesRepository } from '../../application/ports/cohortes.repository';
import type { Cohorte, DatosCohorte } from '../../domain/cohorte';

type FilaCohorte = Omit<Cohorte, 'fecha_actualizacion'> & {
  fecha_actualizacion: Date;
};

type ErrorAdaptadorSql = {
  cause?: { originalCode?: unknown; originalMessage?: unknown };
};

const CAMPOS_COHORTE = Prisma.sql`
  id_cohorte, nombre_cohorte,
  to_char(fecha_inicio_programa, 'YYYY-MM-DD') AS fecha_inicio_programa,
  to_char(fecha_fin_programa, 'YYYY-MM-DD') AS fecha_fin_programa,
  id_cronograma, estado::text AS estado, fecha_actualizacion
`;

const ERRORES_SQL: Record<
  string,
  readonly [estado: string, codigo: CodigoErrorCohorte]
> = {
  CRONOGRAMA_NO_ENCONTRADO: ['AD404', 'CRONOGRAMA_NO_ENCONTRADO'],
  CRONOGRAMA_NO_ACTIVO: ['AD422', 'CRONOGRAMA_NO_ACTIVO'],
  TRANSICION_COHORTE_INVALIDA: ['AD409', 'TRANSICION_COHORTE_INVALIDA'],
  ROL_INVALIDO: ['AD422', 'ROL_INVALIDO'],
  ck_cohorte_fechas: ['23514', 'FECHAS_COHORTE_INVALIDAS'],
  ck_cohorte_nombre: ['23514', 'NOMBRE_COHORTE_INVALIDO'],
  uq_cohorte_nombre_vigente: ['23505', 'NOMBRE_COHORTE_DUPLICADO'],
};

@Injectable()
export class PrismaCohortesRepository implements CohortesRepository {
  async buscarParaActualizar(tx: Prisma.TransactionClient, id: string) {
    const [fila] = await this.consultar(
      tx,
      Prisma.sql`
      SELECT ${CAMPOS_COHORTE}
      FROM administrativo.cohortes
      WHERE id_cohorte = ${id}::uuid AND fecha_eliminacion IS NULL
      FOR UPDATE
    `,
    );
    return fila ?? null;
  }

  async crear(
    tx: Prisma.TransactionClient,
    id: string,
    datos: DatosCohorte,
    actor: string,
  ) {
    const [cohorte] = await this.consultar(
      tx,
      Prisma.sql`
      INSERT INTO administrativo.cohortes (
        id_cohorte, nombre_cohorte, fecha_inicio_programa, fecha_fin_programa,
        id_cronograma, creado_por
      ) VALUES (
        ${id}::uuid, ${datos.nombre_cohorte}, ${datos.fecha_inicio_programa}::date,
        ${datos.fecha_fin_programa}::date, ${datos.id_cronograma}::uuid, ${actor}::uuid
      )
      RETURNING ${CAMPOS_COHORTE}
    `,
    );
    if (!cohorte) throw errorCohorte('ERROR_PERSISTENCIA_COHORTE');
    return cohorte;
  }

  async actualizar(
    tx: Prisma.TransactionClient,
    cohorte: Cohorte,
    actor: string,
  ) {
    const [actualizada] = await this.consultar(
      tx,
      Prisma.sql`
      UPDATE administrativo.cohortes
      SET nombre_cohorte = ${cohorte.nombre_cohorte},
          fecha_inicio_programa = ${cohorte.fecha_inicio_programa}::date,
          fecha_fin_programa = ${cohorte.fecha_fin_programa}::date,
          id_cronograma = ${cohorte.id_cronograma}::uuid,
          estado = ${cohorte.estado}::administrativo.estado_cohorte_enum,
          actualizado_por = ${actor}::uuid
      WHERE id_cohorte = ${cohorte.id_cohorte}::uuid AND fecha_eliminacion IS NULL
      RETURNING ${CAMPOS_COHORTE}
    `,
    );
    if (!actualizada) throw errorCohorte('COHORTE_NO_ENCONTRADA');
    return actualizada;
  }

  private async consultar(tx: Prisma.TransactionClient, consulta: Prisma.Sql) {
    try {
      const filas = await tx.$queryRaw<FilaCohorte[]>(consulta);
      return filas.map(({ fecha_actualizacion, ...fila }) => ({
        ...fila,
        fecha_actualizacion: fecha_actualizacion.toISOString(),
      }));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2010'
      ) {
        const meta = error.meta;
        const adaptador = meta?.driverAdapterError as
          ErrorAdaptadorSql | undefined;
        const code = adaptador?.cause?.originalCode ?? meta?.code;
        const message = adaptador?.cause?.originalMessage ?? meta?.message;
        if (typeof message === 'string') {
          for (const [token, [estado, codigo]] of Object.entries(ERRORES_SQL)) {
            if (estado === code && message.includes(token))
              throw errorCohorte(codigo);
          }
        }
      }
      throw errorCohorte('ERROR_PERSISTENCIA_COHORTE', error);
    }
  }
}
