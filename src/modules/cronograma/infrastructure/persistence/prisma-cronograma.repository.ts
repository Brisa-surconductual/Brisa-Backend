import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Cronograma } from '../../domain/entities/cronograma.entity';
import { CronogramaRepository } from '../../domain/repositories/cronograma.repository';
import { CronogramaMapper } from '../mappers/cronograma.mapper';

@Injectable()
export class PrismaCronogramaRepository implements CronogramaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarBaseActiva(): Promise<Cronograma | null> {
    const cronograma = await this.prisma.cronogramas.findFirst({
      where: {
        es_base: true,
        estado: 'ACTIVO',
      },
      orderBy: {
        fecha_activacion: 'desc',
      },
    });

    return cronograma ? CronogramaMapper.toDomain(cronograma) : null;
  }

  async existeBaseConfigurado(): Promise<boolean> {
    const total = await this.prisma.cronogramas.count({
      where: { es_base: true },
    });

    return total > 0;
  }
}
