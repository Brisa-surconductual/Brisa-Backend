import { Injectable } from '@nestjs/common';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { CrearCronogramaDtoRequest } from '../../dto/cronograma/crear-cronograma.dto-request';
import { CrearCronogramaDtoResponse } from '../../dto/cronograma/crear-cronograma.dto-response';
import { Cronograma } from '../../../domain/entities/cronograma.entity';
import { FechaInicioNoHayaPasoException } from '../../../domain/exeption/cronograma/fecha-inicio-no-haya-paso.exeption';

@Injectable()
export class CrearCronogramaUseCase {
  constructor(private readonly cronogramaRepository: CronogramaRepository) {}

  async execute(
    dto: CrearCronogramaDtoRequest,
  ): Promise<CrearCronogramaDtoResponse> {
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    if (
      dto.fecha_activacion &&
      dto.fecha_activacion.toISOString().slice(0, 10) < hoy
    ) {
      throw new FechaInicioNoHayaPasoException();
    }

    const cronograma = Cronograma.crearCronograma(
      dto.nombre,
      dto.es_base,
      dto.fecha_activacion,
    );

    await this.cronogramaRepository.save(cronograma);
    return CrearCronogramaDtoResponse.crearMensaje();
  }
}
