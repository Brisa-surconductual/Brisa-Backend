import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { Injectable } from '@nestjs/common';
import { ObtenerCronogramasDtoResponse } from '../../dto/cronograma/obtener-cronogramas.dto-response';

@Injectable()
export class ObtenerCronogramasUseCase {
  constructor(private readonly cronogramaRepository: CronogramaRepository) {}

  async execute(): Promise<ObtenerCronogramasDtoResponse[]> {
    const cronogramas = await this.cronogramaRepository.obtenerCronogramas();

    return ObtenerCronogramasDtoResponse.respuesta(cronogramas);
  }
}