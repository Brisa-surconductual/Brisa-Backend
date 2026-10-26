import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ResultadoTransicionModalidad,
  TransicionModalidadProgramaRepository,
} from '../../domain/repositories/transicion-modalidad-programa.repository';

export interface SolicitudHabilitarModalidad {
  readonly idPrograma: number;
  readonly idAdministrador: string;
  readonly confirmacionTransicion: boolean;
}

@Injectable()
export class HabilitarModalidadPersonalizadaUseCase {
  constructor(
    private readonly transiciones: TransicionModalidadProgramaRepository,
  ) {}

  async execute(
    solicitud: SolicitudHabilitarModalidad,
  ): Promise<ResultadoTransicionModalidad> {
    if (
      !Number.isSafeInteger(solicitud.idPrograma) ||
      solicitud.idPrograma <= 0
    ) {
      throw new BadRequestException(
        'El identificador del programa es invalido.',
      );
    }

    if (
      typeof solicitud.idAdministrador !== 'string' ||
      solicitud.idAdministrador.trim().length === 0
    ) {
      throw new BadRequestException(
        'El administrador responsable es obligatorio.',
      );
    }

    if (solicitud.confirmacionTransicion !== true) {
      throw new BadRequestException(
        'La transicion requiere confirmacion explicita.',
      );
    }

    return this.transiciones.habilitarPersonalizada({
      idPrograma: solicitud.idPrograma,
      idAdministrador: solicitud.idAdministrador,
    });
  }
}
