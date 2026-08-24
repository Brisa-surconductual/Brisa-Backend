import { Injectable } from "@nestjs/common";
import { UnidadTemporalRepository } from "../../domain/repositories/unidad-temporal.repository";
import { UnidadTemporal } from "../../domain/entities/unidad-temporal.entity";
import { UnidadTemporalDtoRequest } from "../dto/crear-unidad-temporal.dto-request";
import { UnidadTemporalDtoResponse } from "../dto/crear-unidad-temporal.dto-response";
import { ConsistenciaFechasVO } from "../../domain/value-objects/cosistencia-fechas.vo";
import { CronogramaRepository } from "../../domain/repositories/cronograma.repository";
import { ValidarSolapamientoUnidadTemporalService } from "../service/validar-solapamiento-unidad-temporal.service";
import { CalculoOrdenUnidadTemporalService } from "../service/calculo-orden-unidad-temporal.service";
import { CronogramaNoEncontradoException } from "../../domain/exeption/cronograma-no-encontrado.exeption";
import { CronogramaNoActivoException } from "../../domain/exeption/cronograma-no-activo.exeptio";

@Injectable()
export class CreacionUnidadTemporalUseCase {
  constructor(
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly cronogramaRepository: CronogramaRepository,
    private readonly validarSolapamientoUnidadTemporalService: ValidarSolapamientoUnidadTemporalService,
    private readonly calculoOrdenUnidadTemporalService: CalculoOrdenUnidadTemporalService,
  ) {}

  async execute(dto: UnidadTemporalDtoRequest): Promise<UnidadTemporalDtoResponse> {
    new ConsistenciaFechasVO(dto.fecha_inicio, dto.fecha_fin);

    const cronograma = await this.cronogramaRepository.buscarPorId(dto.id_cronograma);

    if (!cronograma) {
      throw new CronogramaNoEncontradoException();
    }
    if (cronograma.estado !== "ACTIVO") {
      throw new CronogramaNoActivoException();
    }

    const unidadesExistentes = await this.unidadTemporalRepository.obtenerPorCronograma(
      dto.id_cronograma,
    );

    const ordenUnidad = this.calculoOrdenUnidadTemporalService.calcularSiguienteOrden(unidadesExistentes);

    this.validarSolapamientoUnidadTemporalService.validarSolapamiento(unidadesExistentes, dto.fecha_inicio, dto.fecha_fin);

    const nuevaUnidadTemporal = UnidadTemporal.crear(
      dto.id_cronograma,
      dto.nombre,
      ordenUnidad,
      dto.fecha_inicio,
      dto.fecha_fin,
    );

    const unidadCreada = await this.unidadTemporalRepository.crearUnidadTemporal(
      nuevaUnidadTemporal
    );

    return UnidadTemporalDtoResponse.crear(unidadCreada);
  }
}