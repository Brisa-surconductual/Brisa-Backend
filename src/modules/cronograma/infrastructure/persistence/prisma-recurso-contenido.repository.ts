import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { DatosRecursoIncoherentesException } from '../../domain/exeption/datos-recurso-incoherentes.exception';
import { ListaRecursosReordenamientoInvalidaException } from '../../domain/exeption/lista-recursos-reordenamiento-invalida.exception';
import { ModuloDestinoNoDisponibleException } from '../../domain/exeption/modulo-destino-no-disponible.exception';
import { OrdenRecursoDuplicadoException } from '../../domain/exeption/orden-recurso-duplicado.exception';
import { RecursoSinModuloDestinoException } from '../../domain/exeption/recurso-sin-modulo-destino.exception';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { RecursoContenidoMapper } from '../mappers/recurso-contenido.mapper';

@Injectable()
export class PrismaRecursoContenidoRepository implements RecursoContenidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearConModulosDestino(
    recurso: RecursoContenido,
    idModulos: string[],
  ): Promise<RecursoContenido> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const modulosActivos = await tx.modulos_sistema.findMany({
            where: {
              id_modulo: { in: idModulos },
              activo: true,
            },
            select: { id_modulo: true },
          });

          if (modulosActivos.length !== idModulos.length) {
            throw new ModuloDestinoNoDisponibleException();
          }

          const creado = await tx.recursos_contenido.create({
            data: RecursoContenidoMapper.toPrisma(recurso),
          });

          await tx.recursos_modulos_destino.createMany({
            data: idModulos.map((idModulo) => ({
              id_recurso: recurso.id_recurso,
              id_modulo: idModulo,
            })),
          });

          return RecursoContenidoMapper.toDomain(creado);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      this.traducirErrorPersistencia(error);
    }
  }

  async reordenar(idContenido: string, idRecursos: string[]): Promise<void> {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const recursos = await tx.recursos_contenido.findMany({
            where: { id_contenido: idContenido },
            select: { id_recurso: true },
          });
          const idsExistentes = new Set(
            recursos.map((recurso) => recurso.id_recurso),
          );
          const listaCompleta =
            recursos.length === idRecursos.length &&
            new Set(idRecursos).size === idRecursos.length &&
            idRecursos.every((idRecurso) => idsExistentes.has(idRecurso));

          if (!listaCompleta) {
            throw new ListaRecursosReordenamientoInvalidaException();
          }

          for (const [indice, idRecurso] of idRecursos.entries()) {
            await tx.recursos_contenido.update({
              where: { id_recurso: idRecurso },
              data: { orden_bloque: -(indice + 1) },
            });
          }

          for (const [indice, idRecurso] of idRecursos.entries()) {
            await tx.recursos_contenido.update({
              where: { id_recurso: idRecurso },
              data: { orden_bloque: indice + 1 },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (error instanceof ListaRecursosReordenamientoInvalidaException) {
        throw error;
      }
      this.traducirErrorPersistencia(error);
    }
  }

  private traducirErrorPersistencia(error: unknown): never {
    if (error instanceof ModuloDestinoNoDisponibleException) {
      throw error;
    }

    const detalle = this.obtenerDetalle(error);

    if (
      detalle.includes('trg_recurso_requiere_modulo') ||
      detalle.includes('debe tener al menos un módulo destino asignado')
    ) {
      throw new RecursoSinModuloDestinoException();
    }

    if (
      detalle.includes('ck_recurso_coherente') ||
      (this.esErrorPrisma(error, 'P2004') &&
        detalle.includes('check constraint'))
    ) {
      throw new DatosRecursoIncoherentesException();
    }

    if (this.esErrorPrisma(error, 'P2002')) {
      throw new OrdenRecursoDuplicadoException();
    }

    if (this.esErrorPrisma(error, 'P2003')) {
      if (detalle.includes('fk_rmd_modulo') || detalle.includes('id_modulo')) {
        throw new ModuloDestinoNoDisponibleException();
      }
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
