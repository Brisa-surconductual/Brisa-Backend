import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ContenidoVigenteUsuario } from '../../domain/entities/contenido-vigente-usuario.entity';
import { InformacionTemporalUsuario } from '../../domain/entities/informacion-temporal-usuario.entity';
import { UbicacionTemporalUsuario } from '../../domain/entities/ubicacion-temporal-usuario.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { CronogramaActivoUsuarioNoEncontradoException } from '../../domain/exeption/cronograma/cronograma-activo-usuario-no-encontrado.exception';
import { InformacionTemporalUsuarioRepository } from '../../domain/repositories/informacion-temporal-usuario.repository';

interface InformacionTemporalRow {
  ubicacion_id_usuario: string;
  ubicacion_id_cronograma_usuario: string;
  ubicacion_id_cronograma: string;
  ubicacion_id_unidad_temporal: string | null;
  ubicacion_nombre_unidad: string | null;
  ubicacion_orden_unidad: number | null;
  fecha_calculo: Date;
  tiempo_efectivo_transcurrido_segundos: number;
  cronograma_finalizado: boolean;
  mensaje: string | null;
  contenido_id_contenido: string | null;
  contenido_id_contenido_cronograma: string | null;
  contenido_nombre_contenido: string | null;
  contenido_tipo_contenido: TipoContenido | null;
  contenido_id_unidad_temporal: string | null;
  contenido_nombre_unidad: string | null;
  contenido_orden_unidad: number | null;
  contenido_orden_contenido: number | null;
  contenido_fecha_inicio_disponibilidad: Date | null;
  contenido_fecha_fin_disponibilidad: Date | null;
  contenido_estado_disponibilidad: EstadoContenido | null;
}

@Injectable()
export class PrismaInformacionTemporalUsuarioRepository implements InformacionTemporalUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<InformacionTemporalUsuario> {
    try {
      const filas = await this.prisma.$queryRaw<InformacionTemporalRow[]>(
        Prisma.sql`
          SELECT *
          FROM cronograma.fn_informacion_temporal_usuario(
            ${idUsuario}::uuid,
            ${fechaConsulta}::timestamptz
          )
        `,
      );
      const primeraFila = filas[0];

      if (!primeraFila) {
        throw new Error(
          'La función de información temporal no retornó un resultado.',
        );
      }

      const ubicacion = this.mapearUbicacion(primeraFila);
      const contenidos = filas
        .map((fila) => this.mapearContenido(fila))
        .filter(
          (contenido): contenido is ContenidoVigenteUsuario =>
            contenido !== null,
        );

      return new InformacionTemporalUsuario(ubicacion, contenidos);
    } catch (error: unknown) {
      const detalle = this.obtenerDetalle(error);

      if (
        detalle.includes('rf23_cronograma_activo_no_asignado') ||
        detalle.includes('no tiene un cronograma activo asignado')
      ) {
        throw new CronogramaActivoUsuarioNoEncontradoException();
      }

      throw error;
    }
  }

  private mapearUbicacion(
    fila: InformacionTemporalRow,
  ): UbicacionTemporalUsuario {
    return new UbicacionTemporalUsuario(
      fila.ubicacion_id_usuario,
      fila.ubicacion_id_cronograma_usuario,
      fila.ubicacion_id_cronograma,
      fila.ubicacion_id_unidad_temporal,
      fila.ubicacion_nombre_unidad,
      fila.ubicacion_orden_unidad,
      fila.fecha_calculo,
      fila.tiempo_efectivo_transcurrido_segundos,
      fila.cronograma_finalizado,
      fila.mensaje,
    );
  }

  private mapearContenido(
    fila: InformacionTemporalRow,
  ): ContenidoVigenteUsuario | null {
    if (fila.contenido_id_contenido === null) {
      return null;
    }

    if (
      fila.contenido_id_contenido_cronograma === null ||
      fila.contenido_nombre_contenido === null ||
      fila.contenido_tipo_contenido === null ||
      fila.contenido_id_unidad_temporal === null ||
      fila.contenido_nombre_unidad === null ||
      fila.contenido_orden_unidad === null ||
      fila.contenido_fecha_inicio_disponibilidad === null ||
      fila.contenido_fecha_fin_disponibilidad === null ||
      fila.contenido_estado_disponibilidad === null
    ) {
      throw new Error(
        'La función de información temporal retornó un contenido incompleto.',
      );
    }

    return new ContenidoVigenteUsuario(
      fila.contenido_id_contenido,
      fila.contenido_id_contenido_cronograma,
      fila.contenido_nombre_contenido,
      fila.contenido_tipo_contenido,
      fila.contenido_id_unidad_temporal,
      fila.contenido_nombre_unidad,
      fila.contenido_orden_unidad,
      fila.contenido_orden_contenido,
      fila.contenido_fecha_inicio_disponibilidad,
      fila.contenido_fecha_fin_disponibilidad,
      fila.contenido_estado_disponibilidad,
    );
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
