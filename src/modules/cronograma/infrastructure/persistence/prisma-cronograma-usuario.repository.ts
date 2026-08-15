import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CronogramaUsuario } from '../../domain/entities/cronograma-usuario.entity';
import { CronogramaBaseInactivoException } from '../../domain/exeption/cronograma-base-inactivo.exception';
import { CronogramaUsuarioYaInicializadoException } from '../../domain/exeption/cronograma-usuario-ya-inicializado.exception';
import { CronogramaUsuarioRepository } from '../../domain/repositories/cronograma-usuario.repository';
import { CronogramaUsuarioMapper } from '../mappers/cronograma-usuario.mapper';

@Injectable()
export class PrismaCronogramaUsuarioRepository implements CronogramaUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorUsuario(idUsuario: string): Promise<CronogramaUsuario | null> {
    const cronogramaUsuario = await this.prisma.cronogramas_usuario.findUnique({
      where: { id_usuario: idUsuario },
    });

    return cronogramaUsuario
      ? CronogramaUsuarioMapper.toDomain(cronogramaUsuario)
      : null;
  }

  async crear(cronogramaUsuario: CronogramaUsuario): Promise<void> {
    try {
      await this.prisma.cronogramas_usuario.create({
        data: CronogramaUsuarioMapper.toPrisma(cronogramaUsuario),
      });
    } catch (error: unknown) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new CronogramaUsuarioYaInicializadoException();
      }

      if (this.esRechazoPorCronogramaInactivo(error)) {
        throw new CronogramaBaseInactivoException();
      }

      throw error;
    }
  }

  private esErrorPrisma(error: unknown, codigo: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === codigo
    );
  }

  private esRechazoPorCronogramaInactivo(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const errorPrisma = error as {
      message?: string;
      meta?: { database_error?: string; message?: string };
    };
    const detalle = [
      errorPrisma.message,
      errorPrisma.meta?.database_error,
      errorPrisma.meta?.message,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      detalle.includes('trg_cronograma_usuario_validar_activo') ||
      (detalle.includes('cronograma') && detalle.includes('activo'))
    );
  }
}
