import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Sesion } from '../../domain/entities/sesiones.entity';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { SesionMapper } from '../mappers/sesion.mapper';

@Injectable()
export class PrismaSesionRepository implements SesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(sesion: Sesion): Promise<void> {
    await this.prisma.sesiones.create({
      data: SesionMapper.toPrisma(sesion) as any,
    });
  }

  async buscarActivaPorTokenHash(tokenHash: string): Promise<Sesion | null> {
    const sesion = await this.prisma.sesiones.findFirst({
      where: {
        token_hash: tokenHash,
        activa: true,
      },
      select: {
        id_sesion: true,
        id_usuario: true,
        token_hash: true,
        csrf_token_hash: true,
        alcance_sesion: true,
        fecha_inicio_sesion: true,
        fecha_ultima_interaccion: true,
        limite_inactividad_minutos: true,
        estado_aplicacion: true,
        activa: true,
        fecha_cierre_sesion: true,
        motivo_cierre: true,
      },
    });

    return sesion ? SesionMapper.toDomain(sesion) : null;
  }

  async cerrarActiva(
    idSesion: string,
    fechaCierre: Date,
    motivo: MotivoCierre,
  ): Promise<boolean> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: {
        id_sesion: idSesion,
        activa: true,
      },
      data: {
        activa: false,
        fecha_cierre_sesion: fechaCierre,
        motivo_cierre: SesionMapper.motivoCierreToPrisma(motivo) as any,
      },
    });

    return resultado.count === 1;
  }

  async registrarActividad(
    idSesion: string,
    fechaInteraccion: Date,
    estadoAplicacion: EstadoAplicacion,
  ): Promise<boolean> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: {
        id_sesion: idSesion,
        activa: true,
      },
      data: {
        fecha_ultima_interaccion: fechaInteraccion,
        estado_aplicacion: SesionMapper.estadoAplicacionToPrisma(
          estadoAplicacion,
        ) as any,
      },
    });

    return resultado.count === 1;
  }

  async actualizarCsrfToken(
    idSesion: string,
    csrfTokenHash: string,
  ): Promise<boolean> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: {
        id_sesion: idSesion,
        activa: true,
      },
      data: {
        csrf_token_hash: csrfTokenHash,
      },
    });

    return resultado.count === 1;
  }

  async expirarPorInactividad(
    fechaLimite: Date,
    fechaCierre: Date,
  ): Promise<number> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: {
        activa: true,
        estado_aplicacion: 'ACTIVA' as any,
        fecha_ultima_interaccion: { lte: fechaLimite },
      },
      data: {
        activa: false,
        fecha_cierre_sesion: fechaCierre,
        motivo_cierre: 'INACTIVIDAD' as any,
      },
    });

    return resultado.count;
  }

  async expirarPorSegundoPlano(
    fechaLimite: Date,
    fechaCierre: Date,
  ): Promise<number> {
    const resultado = await this.prisma.sesiones.updateMany({
      where: {
        activa: true,
        estado_aplicacion: 'SEGUNDO_PLANO' as any,
        fecha_ultima_interaccion: { lte: fechaLimite },
      },
      data: {
        activa: false,
        fecha_cierre_sesion: fechaCierre,
        motivo_cierre: 'SEGUNDO_PLANO' as any,
      },
    });

    return resultado.count;
  }
}
