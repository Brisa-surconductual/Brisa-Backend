import { Injectable } from '@nestjs/common';
import { ContenidosExitentesDtoResponse } from '../../dto/contenido/contenidos-exitentes.dto-response';
import { ContenidoRepository } from '../../../domain/repositories/contenido.repository';
import { ContenidoCronogramaRepository } from '../../../domain/repositories/contenido-cronograma.repository';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { UnidadTemporal } from '../../../domain/entities/unidad-temporal.entity';
import { Cronograma } from '../../../domain/entities/cronograma.entity';

@Injectable()
export class CatologoContenitosUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly cronogramaRepository: CronogramaRepository,
  ) {}

  async execute(): Promise<ContenidosExitentesDtoResponse[]> {
    const contenidos = await this.contenidoRepository.listar();

    const contenidosConDetalle = await Promise.all(
      contenidos.map(async (contenido) => {
        const asociacion =
          await this.contenidoCronogramaRepository.obtenerPorIdContenido(
            contenido.id_contenido,
          );

        let unidadTemporal: UnidadTemporal | null = null;
        let cronograma: Cronograma | null = null;

        if (asociacion && asociacion.id_unidad_temporal) {
          unidadTemporal =
            await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(
              asociacion.id_unidad_temporal,
            );


          if (unidadTemporal && unidadTemporal.id_cronograma) {
            cronograma = await this.cronogramaRepository.buscarPorId(
              unidadTemporal.id_cronograma,
            );
          }
        }

        return {
          contenido,
          asociacion,
          unidadTemporal,
          cronograma,
        };
      }),
    );

    return contenidosConDetalle.map(
      ({ contenido, asociacion, unidadTemporal, cronograma }) =>
        ContenidosExitentesDtoResponse.fromEntity(
          contenido,
          asociacion,
          unidadTemporal,
          cronograma,
        ),
    );
  }
}