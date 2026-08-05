import { Injectable } from '@nestjs/common';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { SesionNoActivaException } from '../../domain/exeption/sesion-no-activa.exception';
import { CerrarSesionDtoResponse } from '../dto/cerrar-sesion.dto-response';

@Injectable()
export class CerrarSesionUseCase {
  constructor(private readonly sesionRepository: SesionRepository) {}

  async execute(idSesion: string): Promise<CerrarSesionDtoResponse> {
    const cerrada = await this.sesionRepository.cerrarActiva(
      idSesion,
      new Date(),
      MotivoCierre.VOLUNTARIO,
    );

    if (!cerrada) {
      throw new SesionNoActivaException();
    }

    return CerrarSesionDtoResponse.crear();
  }
}
