import { Injectable } from '@nestjs/common';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { ContenidoCronogramaRepository } from '../../../domain/repositories/contenido-cronograma.repository';
import { CronogramaCalendarioDtoRequest } from '../../dto/cronograma/cronograma-calendario.dto-request';
import { ObtenerContenidosUnidadDtoResponse } from '../../dto/contenido/obtener-contenidos-unidad.dto-response';
import { UnidadTemporalNoEncontradaException } from '../../../domain/exeption/unidades-temporales/unidad-temporal-no-encotrada.exception';
import { UnidadTemporalNoPerteneceACronogramaException } from '../../../domain/exeption/unidades-temporales/unidad-temporal-no-pertence-cronograma.expetion';
import { CronogramaNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-no-encontrado.exeption';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { UnidadTemporal } from '../../../domain/entities/unidad-temporal.entity';

@Injectable()
export class CronogramaCalendarioUseCase {
  constructor(
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
    private readonly cronogramaRepository: CronogramaRepository,
  ) {}

  async execute(
    request: CronogramaCalendarioDtoRequest,
  ): Promise<ObtenerContenidosUnidadDtoResponse> {
    const cronograma = await this.cronogramaRepository.buscarPorId(
      request.idCronograma,
    );
    if (!cronograma) {
      throw new CronogramaNoEncontradoException();
    }

    const unidadTemporal =
      await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(
        request.idUnidadTemporal,
      );
    if (!unidadTemporal) {
      throw new UnidadTemporalNoEncontradaException();
    }

    if (unidadTemporal.id_cronograma !== cronograma.id_cronograma) {
      throw new UnidadTemporalNoPerteneceACronogramaException();
    }

    const relacionesDB =
      await this.contenidoCronogramaRepository.obtenerContenidosConRecursosPorUnidadTemporal(
        request.idUnidadTemporal,
      );

    const contenidosMapeados = relacionesDB.map((relacion) => {
      const contenido = relacion.contenidos;
      return {
        idContenido: contenido.id_contenido,
        nombreContenido: contenido.nombre_contenido,
        tipo: contenido.tipo_contenido,
        recursos: contenido.recursos_contenido.map((recurso) => ({
          idRecurso: recurso.id_recurso,
          claveAlmacenamiento: recurso.clave_almacenamiento,
        })),
      };
    });

    const estadoCronograma = cronograma.estado;

    const estadoUnidadTemporal = unidadTemporal.obtenerEstado();

    return new ObtenerContenidosUnidadDtoResponse({
      cronogramaId: request.idCronograma,
      unidadTemporalId: request.idUnidadTemporal,
      estadoCronograma: estadoCronograma,
      estadoUnidadTemporal: estadoUnidadTemporal,
      contenidos: contenidosMapeados,
    });
  }
}
