import { Injectable } from '@nestjs/common';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { UnidadTemporal } from '../../../domain/entities/unidad-temporal.entity';
import { UnidadTemporalDtoRequest } from '../../dto/contenidoUnidadTemporal/crear-unidad-temporal.dto-request';
import { UnidadTemporalDtoResponse } from '../../dto/contenidoUnidadTemporal/crear-unidad-temporal.dto-response';
import { ConsistenciaFechasVO } from '../../../domain/value-objects/cosistencia-fechas.vo';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { ValidarSolapamientoTemporalService } from '../../service/validar-solapamiento-temporal.service';
import { ReordenarUnidadTemporalService } from '../../service/reordenar-unidad-temporal.service';
import { CronogramaNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-no-encontrado.exeption';
import { CronogramaNoActivoException } from '../../../domain/exeption/cronograma/cronograma-no-activo.exeptio';

@Injectable()
export class CreacionUnidadTemporalUseCase {
  constructor(
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly cronogramaRepository: CronogramaRepository,
    private readonly validarSolapamientoTemporalService: ValidarSolapamientoTemporalService,
    private readonly reordenarUnidadTemporalService: ReordenarUnidadTemporalService,
  ) {}

  async execute(
    dto: UnidadTemporalDtoRequest,
  ): Promise<UnidadTemporalDtoResponse> {
    new ConsistenciaFechasVO(dto.fecha_inicio, dto.fecha_fin);

    const cronograma = await this.cronogramaRepository.buscarPorId(
      dto.id_cronograma,
    );

    if (!cronograma) {
      throw new CronogramaNoEncontradoException();
    }
    if (cronograma.estado !== 'ACTIVO') {
      throw new CronogramaNoActivoException();
    }

    const unidadesExistentes =
      await this.unidadTemporalRepository.obtenerPorCronograma(
        dto.id_cronograma,
      );

    this.validarSolapamientoTemporalService.validarSolapamiento(
      unidadesExistentes,
      dto.fecha_inicio,
      dto.fecha_fin,
    );

    const nuevaUnidadTentativa = UnidadTemporal.crear(
      dto.id_cronograma,
      dto.nombre,
      0, // orden provisional, se recalcula abajo
      dto.fecha_inicio,
      dto.fecha_fin,
    );

    const nuevoOrden = this.reordenarUnidadTemporalService.recalcularOrden([
      ...unidadesExistentes,
      nuevaUnidadTentativa,
    ]);

    const ordenAsignado = nuevoOrden.find(
      (o) => o.id_unidad_temporal === nuevaUnidadTentativa.id_unidad_Temporal,
    )!.orden_unidad;

    const nuevaUnidadTemporal = UnidadTemporal.crear(
      dto.id_cronograma,
      dto.nombre,
      ordenAsignado,
      dto.fecha_inicio,
      dto.fecha_fin,
    );

    const ordenParaHermanas = nuevoOrden.filter(
      (o) => o.id_unidad_temporal !== nuevaUnidadTentativa.id_unidad_Temporal,
    );

    await this.unidadTemporalRepository.crearConReordenamiento(
      nuevaUnidadTemporal,
      ordenParaHermanas,
    );

    return UnidadTemporalDtoResponse.crear();
  }
}
