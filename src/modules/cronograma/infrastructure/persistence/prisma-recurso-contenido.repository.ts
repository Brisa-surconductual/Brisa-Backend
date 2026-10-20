import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido/contenido-no-encontrado.exception';
import { DatosRecursoIncoherentesException } from '../../domain/exeption/recurso-contenido/datos-recurso-incoherentes.exception';
import { ListaRecursosReordenamientoInvalidaException } from '../../domain/exeption/recurso-contenido/lista-recursos-reordenamiento-invalida.exception';
import { ModuloDestinoNoDisponibleException } from '../../domain/exeption/modulo/modulo-destino-no-disponible.exception';
import { OrdenRecursoDuplicadoException } from '../../domain/exeption/recurso-contenido/orden-recurso-duplicado.exception';
import { RecursoSinModuloDestinoException } from '../../domain/exeption/recurso-contenido/recurso-sin-modulo-destino.exception';
import { RecursoNoEncontradoException } from '../../domain/exeption/recurso-contenido/recurso-no-encontrado.exception';
import { RecursoContenidoActivoException } from '../../domain/exeption/recurso-contenido/recurso-contenido-activo.exception';
import { ActualizacionRecursoInvalidaException } from '../../domain/exeption/recurso-contenido/actualizacion-recurso-invalida.exception';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { CoherenciaDatosRecursoVO } from '../../domain/value-objects/coherencia-datos-recurso.vo';
import {
  CambiosRecursoContenido,
  RecursoContenidoDetalle,
  RecursoContenidoRepository,
} from '../../domain/repositories/recurso-contenido.repository';
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
          await this.asegurarContenidoEditableEnTransaccion(
            tx,
            recurso.id_contenido,
          );
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
          await this.asegurarContenidoEditableEnTransaccion(tx, idContenido);
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

  async listarPorContenido(
    idContenido: string,
  ): Promise<RecursoContenidoDetalle[]> {
    const recursos = await this.prisma.recursos_contenido.findMany({
      where: { id_contenido: idContenido },
      include: { recursos_modulos_destino: { select: { id_modulo: true } } },
      orderBy: { orden_bloque: 'asc' },
    });
    return recursos.map((fila) => ({
      recurso: RecursoContenidoMapper.toDomain(fila),
      idModulos: fila.recursos_modulos_destino.map(
        (destino) => destino.id_modulo,
      ),
    }));
  }

  async buscarDetalle(
    idRecurso: string,
  ): Promise<RecursoContenidoDetalle | null> {
    const fila = await this.prisma.recursos_contenido.findUnique({
      where: { id_recurso: idRecurso },
      include: { recursos_modulos_destino: { select: { id_modulo: true } } },
    });
    return fila === null
      ? null
      : {
          recurso: RecursoContenidoMapper.toDomain(fila),
          idModulos: fila.recursos_modulos_destino.map(
            (destino) => destino.id_modulo,
          ),
        };
  }

  async asegurarContenidoEditable(idContenido: string): Promise<void> {
    const contenido = await this.prisma.contenidos.findUnique({
      where: { id_contenido: idContenido },
      select: { id_contenido: true },
    });
    if (!contenido) throw new ContenidoNoEncontradoException();
    if (await this.existeCronogramaActivo(this.prisma, idContenido)) {
      throw new RecursoContenidoActivoException();
    }
  }

  async actualizar(
    idRecurso: string,
    cambios: CambiosRecursoContenido,
  ): Promise<RecursoContenidoDetalle> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const actual = await tx.recursos_contenido.findUnique({
            where: { id_recurso: idRecurso },
          });
          if (!actual) throw new RecursoNoEncontradoException();
          await this.asegurarContenidoEditableEnTransaccion(
            tx,
            actual.id_contenido,
          );

          const tipoRecurso =
            RecursoContenidoMapper.toDomain(actual).tipo_recurso;
          const texto =
            cambios.textoContenido === undefined
              ? actual.texto_contenido
              : cambios.textoContenido.trim();
          const alternativo =
            cambios.textoAlternativo === undefined
              ? actual.texto_alternativo
              : cambios.textoAlternativo?.trim() || null;
          const duracion =
            cambios.duracionSegundos === undefined
              ? actual.duracion_segundos
              : cambios.duracionSegundos;
          const clave =
            cambios.archivo?.claveAlmacenamiento ?? actual.clave_almacenamiento;
          const mime = cambios.archivo?.mimeType ?? actual.mime_type;
          const tamano =
            cambios.archivo?.tamanoBytes === undefined
              ? actual.tamano_bytes
              : BigInt(cambios.archivo.tamanoBytes);
          if (
            (tipoRecurso === TipoRecurso.TEXTO &&
              (cambios.archivo ||
                cambios.textoAlternativo !== undefined ||
                cambios.duracionSegundos !== undefined)) ||
            (tipoRecurso !== TipoRecurso.TEXTO &&
              cambios.textoContenido !== undefined)
          ) {
            throw new ActualizacionRecursoInvalidaException();
          }
          CoherenciaDatosRecursoVO.validar(
            tipoRecurso,
            texto ?? undefined,
            clave ?? undefined,
            mime ?? undefined,
            tamano === null ? undefined : Number(tamano),
          );

          if (cambios.idModulos !== undefined) {
            const ids = [...new Set(cambios.idModulos)];
            if (ids.length === 0) throw new RecursoSinModuloDestinoException();
            const activos = await tx.modulos_sistema.count({
              where: { id_modulo: { in: ids }, activo: true },
            });
            if (activos !== ids.length)
              throw new ModuloDestinoNoDisponibleException();
            await tx.recursos_modulos_destino.deleteMany({
              where: { id_recurso: idRecurso },
            });
            await tx.recursos_modulos_destino.createMany({
              data: ids.map((idModulo) => ({
                id_recurso: idRecurso,
                id_modulo: idModulo,
              })),
            });
          }
          const actualizado = await tx.recursos_contenido.update({
            where: { id_recurso: idRecurso },
            data: {
              texto_contenido: texto,
              texto_alternativo: alternativo,
              duracion_segundos: duracion,
              clave_almacenamiento: clave,
              mime_type: mime,
              tamano_bytes: tamano,
            },
            include: {
              recursos_modulos_destino: { select: { id_modulo: true } },
            },
          });
          return {
            recurso: RecursoContenidoMapper.toDomain(actualizado),
            idModulos: actualizado.recursos_modulos_destino.map(
              (destino) => destino.id_modulo,
            ),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      this.traducirErrorPersistencia(error);
    }
  }

  async eliminar(idRecurso: string): Promise<void> {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const actual = await tx.recursos_contenido.findUnique({
            where: { id_recurso: idRecurso },
          });
          if (!actual) throw new RecursoNoEncontradoException();
          await this.asegurarContenidoEditableEnTransaccion(
            tx,
            actual.id_contenido,
          );
          await tx.recursos_contenido.delete({
            where: { id_recurso: idRecurso },
          });
          const restantes = await tx.recursos_contenido.findMany({
            where: { id_contenido: actual.id_contenido },
            orderBy: { orden_bloque: 'asc' },
            select: { id_recurso: true },
          });
          for (const [indice, recurso] of restantes.entries()) {
            await tx.recursos_contenido.update({
              where: { id_recurso: recurso.id_recurso },
              data: { orden_bloque: -(indice + 1) },
            });
          }
          for (const [indice, recurso] of restantes.entries()) {
            await tx.recursos_contenido.update({
              where: { id_recurso: recurso.id_recurso },
              data: { orden_bloque: indice + 1 },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      this.traducirErrorPersistencia(error);
    }
  }

  private async asegurarContenidoEditableEnTransaccion(
    tx: Prisma.TransactionClient,
    idContenido: string,
  ): Promise<void> {
    const contenido = await tx.$queryRaw<{ id_contenido: string }[]>(Prisma.sql`
      SELECT id_contenido FROM cronograma.contenidos
      WHERE id_contenido = CAST(${idContenido} AS uuid) FOR UPDATE
    `);
    if (contenido.length === 0) throw new ContenidoNoEncontradoException();
    if (await this.existeCronogramaActivo(tx, idContenido)) {
      throw new RecursoContenidoActivoException();
    }
  }

  private async existeCronogramaActivo(
    cliente: Prisma.TransactionClient | PrismaService,
    idContenido: string,
  ): Promise<boolean> {
    const asociacion = await cliente.contenidos_cronograma.findFirst({
      where: {
        id_contenido: idContenido,
        unidades_temporales: {
          is: { cronogramas: { is: { estado: 'ACTIVO' } } },
        },
      },
      select: { id_contenido_cronograma: true },
    });
    return asociacion !== null;
  }

  private traducirErrorPersistencia(error: unknown): never {
    if (
      error instanceof RecursoNoEncontradoException ||
      error instanceof RecursoContenidoActivoException ||
      error instanceof ActualizacionRecursoInvalidaException
    ) {
      throw error;
    }
    if (error instanceof ModuloDestinoNoDisponibleException) {
      throw error;
    }

    const detalle = this.obtenerDetalle(error);

    if (detalle.includes('ck_recurso_clave_retirada')) {
      throw new ConflictException(
        'La clave del archivo fue retirada. Solicite una nueva URL de subida.',
      );
    }

    if (
      this.esErrorPrisma(error, 'P2034') ||
      detalle.includes('could not serialize') ||
      detalle.includes('deadlock detected')
    ) {
      throw new ConflictException(
        'El contenido cambió durante la operación. Reintente la solicitud.',
      );
    }

    if (detalle.includes('trg_recurso_bloqueo_cronograma_activo')) {
      throw new RecursoContenidoActivoException();
    }

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
      if (detalle.includes('clave_almacenamiento')) {
        throw new ConflictException(
          'El archivo ya está asociado a otro recurso.',
        );
      }
      throw new OrdenRecursoDuplicadoException();
    }

    if (this.esErrorPrisma(error, 'P2025')) {
      throw new RecursoNoEncontradoException();
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
