import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { UbicacionTemporalParticipante } from '../../domain/entities/ubicacion-temporal-participante.entity';
import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';
import {
  ConsultaUbicacionesTemporalesParticipantes,
  PaginaUbicacionesTemporalesParticipantes,
  UbicacionesTemporalesParticipantesRepository,
} from '../../domain/repositories/ubicaciones-temporales-participantes.repository';

interface UbicacionTemporalParticipanteRow {
  total: bigint;
  id_usuario: string | null;
  correo_electronico: string | null;
  id_cronograma_usuario: string | null;
  id_cronograma: string | null;
  nombre_cronograma: string | null;
  estado_cronograma: EstadoCronograma | null;
  fecha_inicio_usuario: Date | null;
  id_unidad_temporal: string | null;
  nombre_unidad: string | null;
  orden_unidad: number | null;
  fecha_inicio_unidad: Date | null;
  fecha_fin_unidad: Date | null;
  fecha_calculo: Date | null;
  tiempo_efectivo_transcurrido_segundos: number | null;
  cronograma_finalizado: boolean | null;
  en_pausa_administrativa: boolean;
  mensaje: string | null;
}

@Injectable()
export class PrismaUbicacionesTemporalesParticipantesRepository implements UbicacionesTemporalesParticipantesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(
    consulta: ConsultaUbicacionesTemporalesParticipantes,
  ): Promise<PaginaUbicacionesTemporalesParticipantes> {
    const condicionesBase: Prisma.Sql[] = [
      Prisma.sql`usuario.rol = 'ESTUDIANTE'::usuario.rol_enum`,
    ];

    if (consulta.idUsuario !== undefined) {
      condicionesBase.push(
        Prisma.sql`usuario.id_usuario = ${consulta.idUsuario}::uuid`,
      );
    }

    if (consulta.idCronograma !== undefined) {
      condicionesBase.push(
        Prisma.sql`asignacion.id_cronograma = ${consulta.idCronograma}::uuid`,
      );
    }

    const condicionesCalculadas: Prisma.Sql[] = [];
    if (consulta.idUnidadTemporal !== undefined) {
      condicionesCalculadas.push(
        Prisma.sql`ubicaciones.id_unidad_temporal = ${consulta.idUnidadTemporal}::uuid`,
      );
    }

    if (consulta.cronogramaFinalizado !== undefined) {
      condicionesCalculadas.push(
        Prisma.sql`ubicaciones.cronograma_finalizado = ${consulta.cronogramaFinalizado}`,
      );
    }

    const desplazamiento = (consulta.pagina - 1) * consulta.limite;
    const filas = await this.prisma.$queryRaw<
      UbicacionTemporalParticipanteRow[]
    >(
      this.construirConsulta(
        condicionesBase,
        condicionesCalculadas,
        consulta.fechaCalculo,
        consulta.limite,
        desplazamiento,
      ),
    );

    return {
      total: Number(filas[0]?.total ?? 0),
      participantes: filas.flatMap((fila) => {
        const participante = this.mapear(fila);
        return participante === null ? [] : [participante];
      }),
    };
  }

  private construirConsulta(
    condicionesBase: Prisma.Sql[],
    condicionesCalculadas: Prisma.Sql[],
    fechaCalculo: Date,
    limite: number,
    desplazamiento: number,
  ): Prisma.Sql {
    const filtroBase = Prisma.join(condicionesBase, ' AND ');
    const filtroCalculado =
      condicionesCalculadas.length === 0
        ? Prisma.sql`TRUE`
        : Prisma.join(condicionesCalculadas, ' AND ');
    const paginarAntesDeCalcular = condicionesCalculadas.length === 0;

    return Prisma.sql`
      WITH participantes_base AS (
        SELECT
          usuario.id_usuario,
          usuario.correo_electronico,
          asignacion.id_cronograma_usuario,
          asignacion.id_cronograma,
          asignacion.fecha_inicio_usuario,
          cronograma.nombre_cronograma,
          cronograma.estado AS estado_cronograma,
          EXISTS (
            SELECT 1
            FROM cronograma.unidades_temporales AS unidad_existente
            WHERE unidad_existente.id_cronograma = asignacion.id_cronograma
          ) AS tiene_unidades
        FROM usuario.usuarios AS usuario
        LEFT JOIN cronograma.cronogramas_usuario AS asignacion
          ON asignacion.id_usuario = usuario.id_usuario
        LEFT JOIN cronograma.cronogramas AS cronograma
          ON cronograma.id_cronograma = asignacion.id_cronograma
        WHERE ${filtroBase}
      ),
      participantes_seleccionados AS (
        SELECT
          participantes_base.*
        FROM participantes_base
        ORDER BY correo_electronico, id_usuario
        ${paginarAntesDeCalcular ? Prisma.sql`LIMIT ${limite} OFFSET ${desplazamiento}` : Prisma.empty}
      ),
      participantes_calculables AS MATERIALIZED (
        SELECT *
        FROM participantes_seleccionados
        WHERE id_cronograma_usuario IS NOT NULL
          AND fecha_inicio_usuario IS NOT NULL
          AND tiene_unidades
      ),
      resultados_ubicacion AS (
        SELECT
          participante.id_usuario AS id_participante_calculado,
          resultado.*
        FROM participantes_calculables AS participante
        CROSS JOIN LATERAL cronograma.fn_ubicacion_temporal_usuario(
          participante.id_usuario,
          ${fechaCalculo}::timestamptz
        ) AS resultado
      ),
      ubicaciones AS (
        SELECT
          participante.*,
          ubicacion.id_unidad_temporal,
          ubicacion.nombre_unidad,
          ubicacion.orden_unidad,
          COALESCE(
            ubicacion.fecha_calculo,
            ${fechaCalculo}::timestamptz
          ) AS fecha_calculo,
          ubicacion.tiempo_efectivo_transcurrido_segundos,
          ubicacion.cronograma_finalizado,
          ubicacion.mensaje AS mensaje_ubicacion,
          unidad.fecha_inicio AS fecha_inicio_unidad,
          unidad.fecha_fin AS fecha_fin_unidad,
          EXISTS (
            SELECT 1
            FROM cronograma.pausas_administrativas AS pausa
            WHERE pausa.id_cronograma_usuario = participante.id_cronograma_usuario
              AND pausa.estado_pausa <> 'ANULADA'::cronograma.estado_pausa_enum
              AND pausa.fecha_inicio_pausa <= ${fechaCalculo}::timestamptz
              AND pausa.fecha_fin_pausa > ${fechaCalculo}::timestamptz
          ) AS en_pausa_administrativa
        FROM participantes_seleccionados AS participante
        LEFT JOIN resultados_ubicacion AS ubicacion
          ON ubicacion.id_participante_calculado = participante.id_usuario
        LEFT JOIN cronograma.unidades_temporales AS unidad
          ON unidad.id_unidad_temporal = ubicacion.id_unidad_temporal
      ),
      ubicaciones_filtradas AS (
        SELECT ubicaciones.*
        FROM ubicaciones
        WHERE ${filtroCalculado}
      ),
      ubicaciones_paginadas AS (
        SELECT *
        FROM ubicaciones_filtradas
        ORDER BY correo_electronico, id_usuario
        ${paginarAntesDeCalcular ? Prisma.empty : Prisma.sql`LIMIT ${limite} OFFSET ${desplazamiento}`}
      ),
      resumen AS (
        SELECT
          ${paginarAntesDeCalcular ? Prisma.sql`(SELECT COUNT(*) FROM participantes_base)` : Prisma.sql`(SELECT COUNT(*) FROM ubicaciones_filtradas)`}::bigint AS total
      )
      SELECT
        resumen.total,
        id_usuario,
        correo_electronico,
        id_cronograma_usuario,
        id_cronograma,
        nombre_cronograma,
        estado_cronograma,
        fecha_inicio_usuario,
        id_unidad_temporal,
        nombre_unidad,
        orden_unidad,
        fecha_inicio_unidad,
        fecha_fin_unidad,
        ubicaciones_paginadas.fecha_calculo,
        tiempo_efectivo_transcurrido_segundos,
        cronograma_finalizado,
        en_pausa_administrativa,
        CASE
          WHEN id_cronograma_usuario IS NULL
            THEN 'El participante no tiene un cronograma asignado.'
          WHEN fecha_inicio_usuario IS NULL
            THEN 'El participante no tiene una fecha de inicio registrada en el programa.'
          WHEN NOT tiene_unidades
            THEN 'El cronograma no cuenta con unidades temporales definidas para realizar el cálculo.'
          ELSE mensaje_ubicacion
        END AS mensaje
      FROM resumen
      LEFT JOIN ubicaciones_paginadas ON TRUE
      ORDER BY correo_electronico, id_usuario
    `;
  }

  private mapear(
    fila: UbicacionTemporalParticipanteRow,
  ): UbicacionTemporalParticipante | null {
    if (
      fila.id_usuario === null ||
      fila.correo_electronico === null ||
      fila.fecha_calculo === null
    ) {
      return null;
    }

    return new UbicacionTemporalParticipante(
      fila.id_usuario,
      fila.correo_electronico,
      fila.id_cronograma_usuario,
      fila.id_cronograma,
      fila.nombre_cronograma,
      fila.estado_cronograma,
      fila.fecha_inicio_usuario,
      fila.id_unidad_temporal,
      fila.nombre_unidad,
      fila.orden_unidad,
      fila.fecha_inicio_unidad,
      fila.fecha_fin_unidad,
      fila.fecha_calculo,
      fila.tiempo_efectivo_transcurrido_segundos,
      fila.cronograma_finalizado,
      fila.en_pausa_administrativa,
      fila.mensaje,
    );
  }
}
