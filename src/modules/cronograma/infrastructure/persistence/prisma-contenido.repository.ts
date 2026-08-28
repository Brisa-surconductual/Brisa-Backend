import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Contenido } from '../../domain/entities/contenido.entity';
import { ContenidoCronogramaActivoException } from '../../domain/exeption/contenido-cronograma-activo.exception';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { ContenidoMapper } from '../mappers/contenido.mapper';

@Injectable()
export class PrismaContenidoRepository implements ContenidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(contenido: Contenido): Promise<Contenido> {
    const creado = await this.prisma.contenidos.create({
      data: ContenidoMapper.toPrisma(contenido),
    });
    return ContenidoMapper.toDomain(creado);
  }

  async buscarPorId(idContenido: string): Promise<Contenido | null> {
    const contenido = await this.prisma.contenidos.findUnique({
      where: { id_contenido: idContenido },
    });
    return contenido ? ContenidoMapper.toDomain(contenido) : null;
  }

  async actualizar(contenido: Contenido): Promise<Contenido> {
    try {
      const actualizado = await this.prisma.contenidos.update({
        where: { id_contenido: contenido.id_contenido },
        data: {
          nombre_contenido: contenido.nombre_contenido,
          tipo_contenido: ContenidoMapper.toPrisma(contenido).tipo_contenido,
          fecha_actualizacion: contenido.fecha_actualizacion,
        },
      });
      return ContenidoMapper.toDomain(actualizado);
    } catch (error: unknown) {
      this.traducirErrorModificacion(error);
    }
  }

  async eliminar(idContenido: string): Promise<void> {
    try {
      await this.prisma.contenidos.delete({
        where: { id_contenido: idContenido },
      });
    } catch (error: unknown) {
      this.traducirErrorModificacion(error);
    }
  }

  private traducirErrorModificacion(error: unknown): never {
    if (this.esBloqueoPorCronogramaActivo(error)) {
      throw new ContenidoCronogramaActivoException();
    }

    if (this.esErrorPrisma(error, 'P2025')) {
      throw new ContenidoNoEncontradoException();
    }

    throw error;
  }

  private esErrorPrisma(error: unknown, codigo: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === codigo
    );
  }

  private esBloqueoPorCronogramaActivo(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const errorPrisma = error as {
      message?: string;
      meta?: unknown;
      cause?: unknown;
    };
    const detalle = [
      errorPrisma.message,
      this.serializar(errorPrisma.meta),
      this.serializar(errorPrisma.cause),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      detalle.includes('trg_contenido_bloqueo_cronograma_activo') ||
      detalle.includes(
        'no se puede modificar un contenido asociado a un cronograma activo',
      )
    );
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
