import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ActivacionCronogramaRepository,
  EstructuraActivacionCronograma,
} from '../../domain/repositories/activacion-cronograma.repository';
import { CronogramaNoEncontradoException } from '../../domain/exeption/cronograma/cronograma-no-encontrado.exeption';
import { CronogramaMapper } from '../mappers/cronograma.mapper';

@Injectable()
export class PrismaActivacionCronogramaRepository extends ActivacionCronogramaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async activar(
    idCronograma: string,
    validar: (estructura: EstructuraActivacionCronograma) => void,
  ) {
    for (let intento = 0; ; intento++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const registro = await tx.cronogramas.findUnique({
              where: { id_cronograma: idCronograma },
              include: {
                unidades_temporales: {
                  include: {
                    contenidos_cronograma: {
                      include: {
                        contenidos: {
                          include: {
                            recursos_contenido: {
                              include: {
                                recursos_modulos_destino: {
                                  include: { modulos_sistema: true },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            });
            if (!registro) throw new CronogramaNoEncontradoException();
            validar({
              cronograma: CronogramaMapper.toDomain(registro),
              unidades: registro.unidades_temporales,
            });
            const ahora = new Date();
            if (registro.es_base) {
              // Solo cambia la selección para próximos ingresos; conserva asignaciones y progreso.
              await tx.cronogramas.updateMany({
                where: {
                  es_base: true,
                  estado: 'ACTIVO',
                  id_cronograma: { not: idCronograma },
                },
                data: { es_base: false, fecha_actualizacion: ahora },
              });
            }
            const activo = await tx.cronogramas.update({
              where: { id_cronograma: idCronograma },
              data: {
                estado: 'ACTIVO',
                fecha_activacion: ahora,
                fecha_actualizacion: ahora,
              },
            });
            return CronogramaMapper.toDomain(activo);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        const codigo =
          error && typeof error === 'object' && 'code' in error
            ? error.code
            : undefined;
        if (codigo === 'P2034' && intento < 2) continue;
        if (codigo === 'P2002' || codigo === 'P2034') {
          throw new ConflictException(
            'El cronograma base cambió durante la activación. Actualiza el panel e intenta nuevamente.',
          );
        }
        throw error;
      }
    }
  }
}
