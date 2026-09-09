import {Injectable} from '@nestjs/common';
import {UnidadTemporalNoEncontradaException} from "../../../domain/exeption/unidades-temporales/unidad-temporal-no-encotrada.exception";
import {UnidadTemporalRepository} from '../../../domain/repositories/unidad-temporal.repository';
import {EliminarUnidadTemporalDtoRequest} from "../../dto/unidadTemporal/eliminar-unidad-temporal.dto.request";
import {EliminarUnidadTemporalDtoResponse} from "../../dto/unidadTemporal/eliminar-unidad-temporal.dto.response";
import {unidadTemporalEnEjecucionException} from "../../../domain/exeption/unidades-temporales/unidad-temporal-en-ejecucion.expetion";
import {unidadTemporalUtilizadaPorUsuariosException} from "../../../domain/exeption/unidades-temporales/unidad-temporal-utilizada-por-usuarios.exeption";
import {ContenidoCronogramaRepository} from "../../../domain/repositories/contenido-cronograma.repository";
import {unidadTemporalConContenidoException} from "../../../domain/exeption/contenido-cronograma/unidad-temporal-con-contenido.exeption";
import {unidadTemporalFinalizadaException} from "../../../domain/exeption/unidades-temporales/unidad-temporal-finalizada.expetion";
import {ReordenarUnidadTemporalService} from "../../service/reordenar-unidad-temporal.service";


@Injectable()
export class EliminarUnidadTemporalUseCase {

    constructor(
        private readonly unidadTemporalRepository: UnidadTemporalRepository,
        private readonly reordenarUnidadTemporalService: ReordenarUnidadTemporalService,
        private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository
    ) {}

    async execute(dto: EliminarUnidadTemporalDtoRequest): Promise<EliminarUnidadTemporalDtoResponse> {
        
        const unidadTemporal = await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(dto.idUnidadTemporal);

        if (!unidadTemporal) {
            throw new UnidadTemporalNoEncontradaException();
        }

        if (unidadTemporal.utilizada_por_usuario === true) {
            throw new unidadTemporalUtilizadaPorUsuariosException();
        }

        if  (unidadTemporal.fecha_inicio <= new Date() && unidadTemporal.fecha_fin >= new Date()) {
            throw new unidadTemporalEnEjecucionException();
        } else if (unidadTemporal.fecha_fin < new Date()) {
            throw new unidadTemporalFinalizadaException();
        }


        const contenidosAsociados = await this.contenidoCronogramaRepository.existeContenidoParaUnidadTemporal(dto.idUnidadTemporal);
        if (contenidosAsociados === true) {
            throw new unidadTemporalConContenidoException();
        }

        const unidadesTemporales = await this.unidadTemporalRepository.obtenerPorCronograma(
            unidadTemporal.id_cronograma,
        )

        const hermanas = unidadesTemporales.filter(
            (u) => u.id_unidad_Temporal !== unidadTemporal.id_unidad_Temporal,
        )

        const reordenamientoHermanas = this.reordenarUnidadTemporalService.recalcularOrden(hermanas);

        await this.unidadTemporalRepository.eliminarConReordenamiento(
            dto.idUnidadTemporal,
            reordenamientoHermanas,
        );
        
        return EliminarUnidadTemporalDtoResponse.crear();

    }
}