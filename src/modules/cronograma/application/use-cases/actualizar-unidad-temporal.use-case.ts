import { Injectable } from "@nestjs/common";
import { UnidadTemporalRepository } from "../../domain/repositories/unidad-temporal.repository";
import { ActualizarUnidadTemporalDtoRequest } from "../dto/unidadTemporal/actualizar-unidad-temporal.dto-request";
import { ActualizarUnidadTemporalDtoResponse } from "../dto/unidadTemporal/actualizar-unidad-temporal.dto-response";
import { UnidadTemporalNoEncontradaException } from '../../domain/exeption/unidad-temporal-no-encotrada.exception';
import { unidadTemporalEnEjecucionException } from '../../domain/exeption/unidad-temporal-en-ejecucion.expetion';
import { unidadTemporalFinalizadaException } from '../../domain/exeption/unidad-temporal-finalizada.expetion';
import { unidadTemporalUsadaPorUsuariosException } from '../../domain/exeption/unidad-temporal-usada-por-usuarios.expetion';
import { UnidadTemporal } from "../../domain/entities/unidad-temporal.entity";
import { ConsistenciaFechasVO } from "../../domain/value-objects/cosistencia-fechas.vo";
import { ValidarSolapamientoTemporalService } from "../service/validar-solapamiento-temporal.service";
import { ReordenarUnidadTemporalService } from "../service/reordenar-unidad-temporal.service";

@Injectable()
export class ActualizarUnidadTemporalUseCase {
    constructor(
        private readonly unidadTemporalRepository: UnidadTemporalRepository,
        private readonly validarSolapamientoTemporalService: ValidarSolapamientoTemporalService,
        private readonly reordenarUnidadTemporalService: ReordenarUnidadTemporalService,
    ) {}

    async execute(dto: ActualizarUnidadTemporalDtoRequest): Promise<ActualizarUnidadTemporalDtoResponse> {

        const unidadTemporal = await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(dto.idUnidadTemporal);
        if (!unidadTemporal) {
            throw new UnidadTemporalNoEncontradaException();
        }

        if (unidadTemporal.utilizada_por_usuario === true) {
            throw new unidadTemporalUsadaPorUsuariosException();
        }

        const ahora = new Date();
        if (unidadTemporal.fecha_fin < ahora) {
            throw new unidadTemporalFinalizadaException();
        }
        if (unidadTemporal.fecha_inicio <= ahora && unidadTemporal.fecha_fin >= ahora) {
            throw new unidadTemporalEnEjecucionException();
        }

        const nombreFinal = dto.nombre ?? unidadTemporal.nombre;
        const fechaInicioFinal = dto.fecha_inicio ?? unidadTemporal.fecha_inicio;
        const fechaFinFinal = dto.fecha_fin ?? unidadTemporal.fecha_fin;

        const fechasConsistentes = new ConsistenciaFechasVO(fechaInicioFinal, fechaFinFinal);

        const unidadesDelCronograma = await this.unidadTemporalRepository.obtenerPorCronograma(
            unidadTemporal.id_cronograma,
        );
        const hermanas = unidadesDelCronograma.filter(
            (u) => u.id_unidad_Temporal !== unidadTemporal.id_unidad_Temporal,
        );

        const fechasCambiaron =
            fechasConsistentes.fecha_inicio.getTime() !== unidadTemporal.fecha_inicio.getTime() ||
            fechasConsistentes.fecha_fin.getTime() !== unidadTemporal.fecha_fin.getTime();

        if (fechasCambiaron) {
            this.validarSolapamientoTemporalService.validarSolapamiento(
                hermanas,
                fechasConsistentes.fecha_inicio,
                fechasConsistentes.fecha_fin,
            );
        }

        // Construir la unidad ya actualizada (orden temporal, se recalcula abajo)
        const unidadActualizada = UnidadTemporal.actualizar(
            unidadTemporal,
            nombreFinal,
            fechasConsistentes.fecha_inicio,
            fechasConsistentes.fecha_fin,
            unidadTemporal.orden_unidad, // provisional
        );

        // Recalcular orden de TODAS (hermanas + la editada) según fecha
        const nuevoOrden = this.reordenarUnidadTemporalService.recalcularOrden([
            ...hermanas,
            unidadActualizada,
        ]);

        const ordenFinalPropio = nuevoOrden.find(
            (o) => o.id_unidad_temporal === unidadActualizada.id_unidad_Temporal,
        )!.orden_unidad;

        const unidadConOrdenFinal = UnidadTemporal.actualizar(
            unidadTemporal,
            nombreFinal,
            fechasConsistentes.fecha_inicio,
            fechasConsistentes.fecha_fin,
            ordenFinalPropio,
        );

        const ordenParaHermanas = nuevoOrden.filter(
            (o) => o.id_unidad_temporal !== unidadActualizada.id_unidad_Temporal,
        );

        await this.unidadTemporalRepository.actualizarConReordenamiento(
            unidadConOrdenFinal,
            ordenParaHermanas,
        );

        return ActualizarUnidadTemporalDtoResponse.respuesta(dto.idUnidadTemporal);
    }
}