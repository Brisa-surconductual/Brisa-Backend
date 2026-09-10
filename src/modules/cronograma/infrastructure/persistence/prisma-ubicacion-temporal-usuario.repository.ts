import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { UbicacionTemporalUsuario } from '../../domain/entities/ubicacion-temporal-usuario.entity';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { FechaInicioUsuarioNoRegistradaException } from '../../domain/exeption/cronograma/fecha-inicio-usuario-no-registrada.exception';
import { UbicacionTemporalUsuarioRepository } from '../../domain/repositories/ubicacion-temporal-usuario.repository';

interface UbicacionTemporalRow {
  id_usuario: string;
  id_cronograma_usuario: string;
  id_cronograma: string;
  id_unidad_temporal: string | null;
  nombre_unidad: string | null;
  orden_unidad: number | null;
  fecha_calculo: Date;
  tiempo_efectivo_transcurrido_segundos: number;
  cronograma_finalizado: boolean;
  mensaje: string | null;
}

@Injectable()
export class PrismaUbicacionTemporalUsuarioRepository implements UbicacionTemporalUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(
    idUsuario: string,
    fechaCalculo: Date,
  ): Promise<UbicacionTemporalUsuario> {
    try {
      const filas = await this.prisma.$queryRaw<UbicacionTemporalRow[]>(
        Prisma.sql`
          SELECT *
          FROM cronograma.fn_ubicacion_temporal_usuario(
            ${idUsuario}::uuid,
            ${fechaCalculo}::timestamptz
          )
        `,
      );
      const fila = filas[0];

      if (!fila) {
        throw new Error(
          'La función de ubicación temporal no retornó un resultado.',
        );
      }

      return new UbicacionTemporalUsuario(
        fila.id_usuario,
        fila.id_cronograma_usuario,
        fila.id_cronograma,
        fila.id_unidad_temporal,
        fila.nombre_unidad,
        fila.orden_unidad,
        fila.fecha_calculo,
        fila.tiempo_efectivo_transcurrido_segundos,
        fila.cronograma_finalizado,
        fila.mensaje,
      );
    } catch (error: unknown) {
      this.traducirErrorFuncion(error);
    }
  }

  private traducirErrorFuncion(error: unknown): never {
    const detalle = this.obtenerDetalle(error);

    if (
      detalle.includes('rf22_fecha_inicio_requerida') ||
      detalle.includes('no tiene una fecha de inicio registrada')
    ) {
      throw new FechaInicioUsuarioNoRegistradaException();
    }

    if (
      detalle.includes('rf22_cronograma_sin_unidades') ||
      detalle.includes('no cuenta con unidades temporales definidas')
    ) {
      throw new CronogramaSinUnidadesTemporalesException();
    }

    throw error;
  }

  private obtenerDetalle(error: unknown): string {
    if (typeof error !== 'object' || error === null) {
      return '';
    }

    const errorPrisma = error as {
      message?: string;
      meta?: unknown;
      cause?: unknown;
    };

    return [
      errorPrisma.message,
      this.serializar(errorPrisma.meta),
      this.serializar(errorPrisma.cause),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private serializar(valor: unknown): string {
    if (valor === undefined || valor === null) {
      return '';
    }

    try {
      return typeof valor === 'string' ? valor : JSON.stringify(valor);
    } catch {
      return 'valor no serializable';
    }
  }
}
