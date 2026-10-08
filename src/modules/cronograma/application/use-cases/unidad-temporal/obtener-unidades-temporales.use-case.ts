import { Injectable } from '@nestjs/common';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { ObtenerUnidadesTemporalesDtoRequest } from '../../dto/unidadTemporal/obtener-unidades-temporales.dto-request';
import {
  ObtenerUnidadesTemporalesDtoResponse
} from '../../dto/unidadTemporal/obtener-unidades-temporales.dto-response';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';


@Injectable()
export class ObtenerUnidadesTemporalesUseCase {

  constructor(private readonly unidadTemporalRepository: UnidadTemporalRepository,
              private readonly cronogramaRepository: CronogramaRepository) {}

  async execute(idCronograma: string): Promise<ObtenerUnidadesTemporalesDtoResponse[]> {

    const cronograma = await this.cronogramaRepository.buscarPorId(idCronograma);
    if (!cronograma) {
      throw new Error('Cronograma no encontrado');
    }
    const unidadesTemporales = await this.unidadTemporalRepository.obtenerUnidadesTemporalesPorIdCronograma(idCronograma);

    return ObtenerUnidadesTemporalesDtoResponse.respuesta(unidadesTemporales);
  }
}
