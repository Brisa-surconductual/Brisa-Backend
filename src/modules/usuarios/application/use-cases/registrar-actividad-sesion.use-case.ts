import { Injectable } from '@nestjs/common';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { SesionNoActivaException } from '../../domain/exeption/sesion-no-activa.exception';
import {
  EstadoAplicacionDto,
  RegistrarActividadSesionDtoRequest,
} from '../dto/registrar-actividad-sesion.dto-request';
import { RegistrarActividadSesionDtoResponse } from '../dto/registrar-actividad-sesion.dto-response';

@Injectable()
export class RegistrarActividadSesionUseCase {
  constructor(private readonly sesionRepository: SesionRepository) {}

  async execute(
    idSesion: string,
    dto: RegistrarActividadSesionDtoRequest,
  ): Promise<RegistrarActividadSesionDtoResponse> {
    const ahora = new Date();
    const estadoAplicacion =
      dto.estadoAplicacion === EstadoAplicacionDto.SEGUNDO_PLANO
        ? EstadoAplicacion.SEGUNDO_PLANO
        : EstadoAplicacion.ACTIVA;

    const actualizada = await this.sesionRepository.registrarActividad(
      idSesion,
      ahora,
      estadoAplicacion,
    );

    if (!actualizada) {
      throw new SesionNoActivaException();
    }

    return RegistrarActividadSesionDtoResponse.crear(
      dto.estadoAplicacion,
      ahora,
    );
  }
}
