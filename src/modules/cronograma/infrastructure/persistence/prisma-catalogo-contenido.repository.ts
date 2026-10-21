import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  CatalogoContenidoRepository,
  EstadoCatalogoContenido,
} from '../../domain/repositories/catalogo-contenido.repository';
import { ContenidoMapper } from '../mappers/contenido.mapper';

@Injectable()
export class PrismaCatalogoContenidoRepository extends CatalogoContenidoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async listar(): Promise<EstadoCatalogoContenido[]> {
    const contenidos = await this.prisma.contenidos.findMany({
      orderBy: [{ fecha_creacion: 'desc' }, { id_contenido: 'asc' }],
      include: {
        contenidos_cronograma: {
          include: { unidades_temporales: { include: { cronogramas: true } } },
        },
        recursos_contenido: {
          include: {
            recursos_modulos_destino: { include: { modulos_sistema: true } },
          },
        },
      },
    });
    return contenidos.map((item) => ({
      contenido: ContenidoMapper.toDomain(item),
      idAsociacion: item.contenidos_cronograma?.id_contenido_cronograma ?? null,
      estadoCronograma:
        item.contenidos_cronograma?.unidades_temporales.cronogramas.estado ??
        null,
      cantidadRecursos: item.recursos_contenido.length,
      recursosListos:
        item.recursos_contenido.length > 0 &&
        item.recursos_contenido.every((recurso) =>
          recurso.recursos_modulos_destino.some(
            (destino) => destino.modulos_sistema.activo,
          ),
        ),
    }));
  }
}
