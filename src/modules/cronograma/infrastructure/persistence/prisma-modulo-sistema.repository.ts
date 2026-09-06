import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';

@Injectable()
export class PrismaModuloSistemaRepository implements ModuloSistemaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarActivos(): Promise<ModuloSistema[]> {
    const modulos = await this.prisma.modulos_sistema.findMany({
      where: { activo: true },
      orderBy: { nombre_modulo: 'asc' },
      select: {
        id_modulo: true,
        codigo_modulo: true,
        nombre_modulo: true,
      },
    });

    return modulos.map(
      (modulo) =>
        new ModuloSistema(
          modulo.id_modulo,
          modulo.codigo_modulo,
          modulo.nombre_modulo,
        ),
    );
  }
}
