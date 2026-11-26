import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CodigoErrorCohorte } from '../../application/exceptions/cohorte.exception';
import { CohorteException } from '../../application/exceptions/cohorte.exception';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import type {
  Cohorte,
  DatosCohorte,
} from '../../domain/entities/cohorte/cohorte.entity';
import type { CohorteConsultada } from '../../domain/results/cohorte-consultada';
import { errorSqlPrisma } from '../expetions/error-sql-prisma';

type FilaCohorte = Omit<Cohorte, 'fecha_actualizacion'> & {
  fecha_actualizacion: Date;
};

type FilaCohorteConsultada = FilaCohorte &
  Pick<CohorteConsultada, 'nombre_cronograma'>;

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
  PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA: [
    'AD409',
    'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA',
  ],
  ROL_INVALIDO: ['AD422', 'ROL_INVALIDO'],
  ck_cohorte_fechas: ['23514', 'FECHAS_COHORTE_INVALIDAS'],
  ck_cohorte_nombre: ['23514', 'NOMBRE_COHORTE_INVALIDO'],
  uq_cohorte_nombre_vigente: ['23505', 'NOMBRE_COHORTE_DUPLICADO'],
};

@Injectable()
export class PrismaCohortesRepository implements CohortesRepository {
  consultarVigentes(
    tx: Prisma.TransactionClient,
    id?: string | readonly string[],
  ) {
    if (id !== undefined && typeof id !== 'string' && id.length === 0)
      return Promise.resolve([]);
    const filtro = this.filtroIdentificadores(id);
    return this.consultar<FilaCohorteConsultada>(
      tx,
      Prisma.sql`
      SELECT cohorte.*, cronograma.nombre_cronograma
      FROM (
        SELECT ${CAMPOS_COHORTE}
        FROM administrativo.cohortes
        WHERE fecha_eliminacion IS NULL ${filtro}
      ) AS cohorte
      JOIN cronograma.cronogramas AS cronograma USING (id_cronograma)
      ORDER BY cohorte.fecha_actualizacion DESC, cohorte.id_cohorte DESC
    `,
      'ERROR_CONSULTA_COHORTE',
    );
  }

  private filtroIdentificadores(id?: string | readonly string[]): Prisma.Sql {
    if (id === undefined) return Prisma.empty;
    if (typeof id === 'string') return Prisma.sql`AND id_cohorte = ${id}::uuid`;
    return Prisma.sql`AND id_cohorte IN (${Prisma.join(id.map((valor) => Prisma.sql`${valor}::uuid`))})`;
  }

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
    if (!cohorte) throw new CohorteException('ERROR_PERSISTENCIA_COHORTE');
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
    if (!actualizada) throw new CohorteException('COHORTE_NO_ENCONTRADA');
    return actualizada;
  }

  private async consultar<T extends FilaCohorte = FilaCohorte>(
    tx: Prisma.TransactionClient,
    consulta: Prisma.Sql,
    codigoFallo: CodigoErrorCohorte = 'ERROR_PERSISTENCIA_COHORTE',
  ) {
    try {
      const filas = await tx.$queryRaw<T[]>(consulta);
      return filas.map(({ fecha_actualizacion, ...fila }) => ({
        ...fila,
        fecha_actualizacion: fecha_actualizacion.toISOString(),
      }));
    } catch (error) {
      const db = errorSqlPrisma(error);
      if (db && typeof db.mensaje === 'string') {
        for (const [token, [estado, codigo]] of Object.entries(ERRORES_SQL)) {
          if (estado === db.estado && db.mensaje.includes(token))
            throw new CohorteException(codigo);
        }
      }
      throw new CohorteException(codigoFallo, error);
    }
  }
}
