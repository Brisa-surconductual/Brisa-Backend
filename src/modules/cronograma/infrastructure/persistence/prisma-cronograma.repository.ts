import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Cronograma } from '../../domain/entities/cronograma.entity';
import { CronogramaRepository } from '../../domain/repositories/cronograma.repository';
import { CronogramaMapper } from '../mappers/cronograma.mapper';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { CronogramaSinContenidoProgramadoException } from '../../domain/exeption/cronograma/cronograma-sin-contenido-programado.exeption';

@Injectable()
export class PrismaCronogramaRepository implements CronogramaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerCronogramas(): Promise<Cronograma[]> {
    const cronogramas = await this.prisma.cronogramas.findMany();
    return cronogramas.map((cronograma) =>
      CronogramaMapper.toDomain(cronograma),
    );
  }

  async save(cronograma: Cronograma): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.cronogramas.create({
        data: CronogramaMapper.toDomain(cronograma),
      });
    });
  }

  async buscarPorId(id: string): Promise<Cronograma> {
    return this.prisma.cronogramas
      .findFirst({
        where: { id_cronograma: id },
      })
      .then((cronograma) => {
        if (!cronograma) {
          throw new Error('Cronograma no encontrado.');
        }
        return CronogramaMapper.toDomain(cronograma);
      });
  }

  async buscarBaseActiva(): Promise<Cronograma | null> {
    const cronograma = await this.prisma.cronogramas.findFirst({
      where: {
        es_base: true,
        estado: 'ACTIVO',
      },
      orderBy: {
        fecha_activacion: 'desc',
      },
      include: {
        unidades_temporales: {
          select: { _count: { select: { contenidos_cronograma: true } } },
        },
      },
    });

    if (!cronograma) return null;
    // Un base histórico o alterado fuera de la activación tampoco debe asignarse vacío.
    if (cronograma.unidades_temporales.length === 0)
      throw new CronogramaSinUnidadesTemporalesException();
    if (
      cronograma.unidades_temporales.every(
        (unidad) => unidad._count.contenidos_cronograma === 0,
      )
    )
      throw new CronogramaSinContenidoProgramadoException();
    return CronogramaMapper.toDomain(cronograma);
  }

  async existeBaseConfigurado(): Promise<boolean> {
    const total = await this.prisma.cronogramas.count({
      where: { es_base: true },
    });

    return total > 0;
  }
}
