import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AsignacionModalidad } from '../../domain/entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../../domain/entities/modalidad/asignacion-modalidad-vigente';
import { TransicionConcurrenteException } from '../../domain/exceptions';
import { ModalidadProgramaRepository } from '../../domain/repositories/modalidad-programa.repository';
import {
  ASIGNACION_VIGENTE_SELECT,
  AsignacionModalidadMapper,
} from '../mappers/asignacion-modalidad.mapper';

@Injectable()
export class PrismaModalidadProgramaRepository extends ModalidadProgramaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarAsignacionesVigentesPorPrograma(
    idPrograma: number,
  ): Promise<AsignacionModalidadVigente[]> {
    const asignaciones = await this.prisma.tipo_terapia.findMany({
      where: {
        id_programa: idPrograma,
        fecha_vigencia_hasta: null,
      },
      select: ASIGNACION_VIGENTE_SELECT,
    });

    return asignaciones.map((fila) => AsignacionModalidadMapper.toDomain(fila));
  }

  async guardarAsignaciones(
    asignaciones: readonly AsignacionModalidad[],
  ): Promise<void> {
    const maximoIntentos = 3;

    for (let intento = 1; intento <= maximoIntentos; intento += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            for (const asignacion of asignaciones.filter((a) => !a.vigente)) {
              const cierre = await tx.tipo_terapia.updateMany({
                where: {
                  id_tipo_terapia: asignacion.idAsignacion,
                  fecha_vigencia_hasta: null,
                },
                data: { fecha_vigencia_hasta: asignacion.fechaVigenciaHasta },
              });

              if (cierre.count !== 1) {
                throw new TransicionConcurrenteException();
              }
            }

            const nuevas = asignaciones.filter((a) => a.vigente);

            if (nuevas.length > 0) {
              await tx.tipo_terapia.createMany({
                data: nuevas.map((asignacion) =>
                  AsignacionModalidadMapper.toCreateData(asignacion),
                ),
              });
            }
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return;
      } catch (error: unknown) {
        if (this.esConflictoDeUnicidad(error)) {
          throw new TransicionConcurrenteException();
        }

        const conflictoSerializable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!conflictoSerializable || intento === maximoIntentos) {
          throw error;
        }
      }
    }
  }

  private esConflictoDeUnicidad(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
