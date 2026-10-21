import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  EstadisticasPrograma,
  EstadisticasProgramaRepository,
} from '../../domain/repositories/estadisticas-programa.repository';
import { Rol } from '../../domain/enums/rol.enum';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { EstadoCronograma } from '../../../cronograma/domain/enums/estado-cronograma.enum';

@Injectable()
export class PrismaEstadisticasProgramaRepository extends EstadisticasProgramaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async consultar(): Promise<EstadisticasPrograma> {
    // Una sola sentencia mantiene los contadores y la duración en la misma instantánea.
    // La proyección no carga identificadores, correos ni perfiles individuales.
    const [estadisticas] = await this.prisma.$queryRaw<EstadisticasPrograma[]>`
      WITH estudiantes AS (
        SELECT
          COUNT(*)::int AS "estudiantesActivos",
          (COUNT(*) FILTER (
            WHERE estado_registro = ${EstadoRegistro.REGISTRO_COMPLETO}::usuario.estado_registro_enum
          ))::int AS "conRegistroCompleto",
          (COUNT(*) FILTER (
            WHERE estado_registro <> ${EstadoRegistro.REGISTRO_COMPLETO}::usuario.estado_registro_enum
          ))::int AS "conRegistroPendiente"
        FROM usuario.usuarios
        WHERE rol = ${Rol.ESTUDIANTE}::usuario.rol_enum
          AND estado_cuenta = ${EstadoCuenta.ACTIVA}::usuario.estado_cuenta_enum
      ), duracion_base AS (
        SELECT MAX(unidad.fecha_fin) - MIN(unidad.fecha_inicio) AS "diasCronogramaBase"
        FROM cronograma.cronogramas AS base
        JOIN cronograma.unidades_temporales AS unidad
          ON unidad.id_cronograma = base.id_cronograma
        WHERE base.es_base = TRUE
          AND base.estado = ${EstadoCronograma.ACTIVO}::cronograma.estado_cronograma_enum
      )
      SELECT estudiantes.*, duracion_base."diasCronogramaBase"
      FROM estudiantes CROSS JOIN duracion_base
    `;
    return estadisticas;
  }
}
