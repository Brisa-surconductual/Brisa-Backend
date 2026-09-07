import { Injectable } from '@nestjs/common';
import { estado_pausa_enum, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PausaAdministrativa } from '../../domain/entities/pausa-administrativa.entity';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../domain/exeption/cronograma-usuario-activo-no-encontrado.exception';
import { FechaInicioPausaFueraRangoException } from '../../domain/exeption/fecha-inicio-pausa-fuera-rango.exception';
import { FechasPausaInvalidasException } from '../../domain/exeption/fechas-pausa-invalidas.exception';
import { PausaAdministrativaSolapadaException } from '../../domain/exeption/pausa-administrativa-solapada.exception';
import {
  ContextoCronogramaActivoUsuario,
  PausaAdministrativaRepository,
} from '../../domain/repositories/pausa-administrativa.repository';
import { PausaAdministrativaMapper } from '../mappers/pausa-administrativa.mapper';

interface PausaAdministrativaRow {
  id_pausa: string;
  id_usuario: string;
  id_cronograma_usuario: string;
  fecha_inicio_pausa: Date;
  fecha_fin_pausa: Date;
  motivo_pausa: string;
  id_usuario_administrativo: string;
  fecha_registro: Date;
  estado_pausa: estado_pausa_enum;
}

@Injectable()
export class PrismaPausaAdministrativaRepository implements PausaAdministrativaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarContextoCronogramaActivo(
    idUsuario: string,
  ): Promise<ContextoCronogramaActivoUsuario | null> {
    const asignacion = await this.prisma.cronogramas_usuario.findFirst({
      where: {
        id_usuario: idUsuario,
        usuarios: { is: { rol: 'ESTUDIANTE' } },
        cronogramas: { is: { estado: 'ACTIVO' } },
      },
      select: {
        id_cronograma_usuario: true,
        fecha_inicio_usuario: true,
        cronogramas: {
          select: {
            unidades_temporales: {
              select: { fecha_inicio: true, fecha_fin: true },
            },
          },
        },
      },
    });

    const unidades = asignacion?.cronogramas.unidades_temporales ?? [];
    if (!asignacion || unidades.length === 0) {
      return null;
    }

    const inicioPlantilla = Math.min(
      ...unidades.map((unidad) => unidad.fecha_inicio.getTime()),
    );
    const finPlantilla = Math.max(
      ...unidades.map((unidad) => unidad.fecha_fin.getTime()),
    );
    const duracionCronograma = finPlantilla - inicioPlantilla;

    if (duracionCronograma < 0) {
      return null;
    }

    return {
      idCronogramaUsuario: asignacion.id_cronograma_usuario,
      fechaInicioUsuario: asignacion.fecha_inicio_usuario,
      fechaFinUsuario: new Date(
        asignacion.fecha_inicio_usuario.getTime() + duracionCronograma,
      ),
    };
  }

  async existeSolapamiento(
    idCronogramaUsuario: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean> {
    const pausa = await this.prisma.pausas_administrativas.findFirst({
      where: {
        id_cronograma_usuario: idCronogramaUsuario,
        estado_pausa: { not: 'ANULADA' },
        fecha_inicio_pausa: { lt: fechaFin },
        fecha_fin_pausa: { gt: fechaInicio },
      },
      select: { id_pausa: true },
    });

    return pausa !== null;
  }

  async crear(pausa: PausaAdministrativa): Promise<PausaAdministrativa> {
    try {
      const creada = await this.prisma.pausas_administrativas.create({
        data: PausaAdministrativaMapper.toPrisma(pausa),
      });

      return PausaAdministrativaMapper.toDomain(creada);
    } catch (error: unknown) {
      this.traducirErrorPersistencia(error);
    }
  }

  async listarPorUsuario(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<PausaAdministrativa[]> {
    const filas = await this.prisma.$queryRaw<PausaAdministrativaRow[]>(
      Prisma.sql`
        SELECT *
        FROM cronograma.fn_historial_pausas_administrativas_usuario(
          ${idUsuario}::uuid,
          ${fechaConsulta}::timestamptz
        )
      `,
    );

    return filas.map((fila) => PausaAdministrativaMapper.toDomain(fila));
  }

  async anular(
    idUsuario: string,
    idPausa: string,
  ): Promise<PausaAdministrativa | null> {
    await this.prisma.pausas_administrativas.updateMany({
      where: {
        id_pausa: idPausa,
        id_usuario: idUsuario,
        estado_pausa: { not: 'ANULADA' },
      },
      data: { estado_pausa: 'ANULADA' },
    });

    const pausa = await this.prisma.pausas_administrativas.findFirst({
      where: {
        id_pausa: idPausa,
        id_usuario: idUsuario,
      },
    });

    return pausa ? PausaAdministrativaMapper.toDomain(pausa) : null;
  }

  private traducirErrorPersistencia(error: unknown): never {
    const detalle = this.obtenerDetalle(error);

    if (
      detalle.includes('ex_pausa_sin_solape') ||
      detalle.includes('conflicting key value violates exclusion constraint')
    ) {
      throw new PausaAdministrativaSolapadaException();
    }

    if (
      detalle.includes('ck_pausa_fechas') ||
      detalle.includes(
        'fecha de finalización de la pausa no puede ser anterior',
      )
    ) {
      throw new FechasPausaInvalidasException();
    }

    if (
      detalle.includes('fecha de inicio de la pausa debe encontrarse dentro')
    ) {
      throw new FechaInicioPausaFueraRangoException();
    }

    if (
      detalle.includes('trg_pausa_validar_rango') ||
      detalle.includes('no tiene un cronograma activo asignado') ||
      this.esErrorPrisma(error, 'P2003')
    ) {
      throw new CronogramaUsuarioActivoNoEncontradoException();
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
