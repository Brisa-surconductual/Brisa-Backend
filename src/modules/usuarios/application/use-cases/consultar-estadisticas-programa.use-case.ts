import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EstadisticasProgramaRepository } from '../../domain/repositories/estadisticas-programa.repository';
import { EstadisticasProgramaDtoResponse } from '../dto/estadisticas-programa.dto-response';

@Injectable()
export class ConsultarEstadisticasProgramaUseCase {
  constructor(private readonly estadisticas: EstadisticasProgramaRepository) {}

  async execute(): Promise<EstadisticasProgramaDtoResponse> {
    try {
      const resultado = await this.estadisticas.consultar();
      return {
        estudiantesActivos: resultado.estudiantesActivos,
        conRegistroCompleto: resultado.conRegistroCompleto,
        conRegistroPendiente: resultado.conRegistroPendiente,
        diasCronogramaBase: resultado.diasCronogramaBase,
      };
    } catch {
      throw new InternalServerErrorException(
        'No fue posible consultar las estadísticas del programa.',
      );
    }
  }
}
