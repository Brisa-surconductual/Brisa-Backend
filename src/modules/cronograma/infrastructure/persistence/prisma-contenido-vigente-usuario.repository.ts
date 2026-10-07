import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ContenidoVigenteUsuario } from '../../domain/entities/contenido-vigente-usuario.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { CronogramaUsuarioNoAsignadoException } from '../../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { FechaInicioUsuarioNoRegistradaException } from '../../domain/exeption/cronograma/fecha-inicio-usuario-no-registrada.exception';
import { ContenidoVigenteUsuarioRepository } from '../../domain/repositories/contenido-vigente-usuario.repository';

interface ContenidoVigenteRow {
  id_contenido: string;
  id_contenido_cronograma: string;
  nombre_contenido: string;
  tipo_contenido: TipoContenido;
  id_unidad_temporal: string;
  nombre_unidad: string;
  orden_unidad: number;
  orden_contenido: number | null;
  fecha_inicio_disponibilidad: Date;
  fecha_fin_disponibilidad: Date;
  estado_disponibilidad: EstadoContenido;
}

@Injectable()
export class PrismaContenidoVigenteUsuarioRepository implements ContenidoVigenteUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<ContenidoVigenteUsuario[]> {
    try {
      const filas = await this.prisma.$queryRaw<ContenidoVigenteRow[]>(
        Prisma.sql`
          SELECT *
          FROM cronograma.fn_contenido_vigente_usuario(
            ${idUsuario}::uuid,
            ${fechaConsulta}::timestamptz
          )
        `,
      );

      return filas.map(
        (fila) =>
          new ContenidoVigenteUsuario(
            fila.id_contenido,
            fila.id_contenido_cronograma,
            fila.nombre_contenido,
            fila.tipo_contenido,
            fila.id_unidad_temporal,
            fila.nombre_unidad,
            fila.orden_unidad,
            fila.orden_contenido,
            fila.fecha_inicio_disponibilidad,
            fila.fecha_fin_disponibilidad,
            fila.estado_disponibilidad,
          ),
      );
    } catch (error: unknown) {
      this.traducirErrorFuncion(error);
    }
  }

  private traducirErrorFuncion(error: unknown): never {
    const detalle = this.obtenerDetalle(error);

    if (
      detalle.includes('rf21_cronograma_usuario_no_asignado') ||
      detalle.includes('no tiene un cronograma asignado')
    ) {
      throw new CronogramaUsuarioNoAsignadoException();
    }

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
