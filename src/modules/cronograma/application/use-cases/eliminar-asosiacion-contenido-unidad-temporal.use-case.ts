import { Injectable } from '@nestjs/common';
import {EliminarAsociacionContenidoUnidadTemporalDtoRequest} from "../dto/contenidoUnidadTemporal/eliminar-asociacion-contenido-unidad-temporal.dto-request";
import {EliminarAsociacionContenidoUnidadTemporalDtoResponse} from "../dto/contenidoUnidadTemporal/eliminar-asociacion-contenido-unidad-temporal.dto-response";
import {ContenidoCronogramaRepository} from "../../domain/repositories/contenido-cronograma.repository";
import {ContenidoCronogramaContenidoNoEncontradoException} from "../../domain/exeption/contenido-cronograma-contenido-no-encontrado.exeption";
import {ReordenarContenidoTemporalService}  from "../service/reordenar-contenido-temporal.service";
@Injectable()
export class EliminarAsociacionContenidoUnidadTemporalUseCase {
    constructor(
        private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
        private readonly reordenarContenidoTemporalService: ReordenarContenidoTemporalService
    ) {}

    async execute(dto: EliminarAsociacionContenidoUnidadTemporalDtoRequest): Promise<EliminarAsociacionContenidoUnidadTemporalDtoResponse> {
        
        const contenidoCronograma = await this.contenidoCronogramaRepository.obtenerPorIdContenidoCronograma(dto.id_contenido_cronograma);
        if (!contenidoCronograma) {
            throw new ContenidoCronogramaContenidoNoEncontradoException();
        }

        contenidoCronograma.validarEliminacion();

        const idUnidadTemporal = contenidoCronograma.id_unidad_temporal;

        await this.contenidoCronogramaRepository.eliminar(dto.id_contenido_cronograma);

        const asociasionesRestantes = await this.contenidoCronogramaRepository.obtnerPorIdUnidadTemporal(idUnidadTemporal);

        if (asociasionesRestantes.length > 0) {
            const reordenamientoHermanas = this.reordenarContenidoTemporalService.recalcularOrden(asociasionesRestantes);
            await this.contenidoCronogramaRepository.actualizarOrdenMasivo(reordenamientoHermanas);
        }


        
        await this.contenidoCronogramaRepository.eliminar(dto.id_contenido_cronograma)
        return EliminarAsociacionContenidoUnidadTemporalDtoResponse.crear()
    }
}