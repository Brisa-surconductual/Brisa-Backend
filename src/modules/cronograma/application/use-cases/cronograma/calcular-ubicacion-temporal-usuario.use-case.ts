import { HttpException, Injectable } from '@nestjs/common';
import { CalculoUbicacionTemporalException } from '../../../domain/exeption/cronograma/calculo-ubicacion-temporal.exception';
import { UbicacionTemporalUsuarioRepository } from '../../../domain/repositories/ubicacion-temporal-usuario.repository';
import { UbicacionTemporalUsuarioDtoResponse } from '../../dto/cronograma/ubicacion-temporal-usuario.dto-response';

@Injectable()
export class CalcularUbicacionTemporalUsuarioUseCase {
  constructor(
    private readonly ubicacionRepository: UbicacionTemporalUsuarioRepository,
  ) {}

  async execute(
    idUsuario: string,
    fechaCalculo: Date = new Date(),
  ): Promise<UbicacionTemporalUsuarioDtoResponse> {
    try {
      const ubicacion = await this.ubicacionRepository.calcular(
        idUsuario,
        fechaCalculo,
      );

      return UbicacionTemporalUsuarioDtoResponse.crear(ubicacion);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new CalculoUbicacionTemporalException();
    }
  }
}
