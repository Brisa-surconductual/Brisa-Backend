import { Injectable } from "@nestjs/common";
import { UnidadTemporalRepository } from "../../domain/repositories/unidad-temporal.repository";
import {ConsistenciaFechasVO} from "../../domain/value-objects/cosistencia-fechas.vo";
import {crearContenidoCronogramaDtoRequest} from "../dto/crear-contenido-cronograma.dto-request";
import {crearContenidoCronogramaDtoResponse} from "../dto/crear-contenido-cronograma.dto-response.dto";
import {CalculoOrdenTemporalService} from "../service/calculo-orden-temporal.service";
import {ValidarSolapamientoTemporalService} from "../service/validar-solapamiento-temporal.service";
import {ContenidoCronogramaRepository} from "../../domain/repositories/contenido-cronograma.repository";
import {ContenidoCronograma} from "../../domain/entities/contenido-cronograma.entity";
import {ContenidoRepository} from "../../domain/repositories/contenido.repository"
import {ContenidoCronogramaContenidoNoEncontradoException} from "../../domain/exeption/contenido-cronograma-contenido-no-encontrado.exeption";
import {UnidadTemporalNoEncontradaException} from "../../domain/exeption/unidad-temporal-no-encotrada.exception";
import {ContenidoUnicaUnidadTemporalException} from "../../domain/exeption/contenido-unica-unidad-temporal.exeption";
import {ReordenarContenidoTemporalService} from "../service/reordenar-contenido-temporal.service";
import { DisponibilidadFueraDeRangoException } from "../../domain/exeption/disponibilidad-fuera-de-rango.exeption";

@Injectable()
export class AsociarContenidoUnidadTemporalUseCase {
    constructor(
        private readonly validarSolapamientoTemporalService: ValidarSolapamientoTemporalService,
        private readonly unidadTemporalRepository: UnidadTemporalRepository,
        private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
        private readonly reordenarContenidoTemporalService: ReordenarContenidoTemporalService,
        private readonly contenidoRepository: ContenidoRepository
    ) {}

    async execute(contenido: crearContenidoCronogramaDtoRequest): Promise<crearContenidoCronogramaDtoResponse> {

        
        const contenidoExistente = await this.contenidoRepository.buscarPorId(contenido.idContenido);
        if (!contenidoExistente) {
            throw new ContenidoCronogramaContenidoNoEncontradoException();
        }

        const unidadTemporal = await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(
            contenido.idUnidadTemporal,
        );
        if (!unidadTemporal) {
            throw new UnidadTemporalNoEncontradaException();
        }

        const yaAsociado = await this.contenidoCronogramaRepository.obtenerPorIdContenido(
            contenido.idContenido,
        );
        if (yaAsociado) {
            throw new ContenidoUnicaUnidadTemporalException();
        }

        const consistenciaFechas = new ConsistenciaFechasVO(
            contenido.fechaInicioDisponibilidad,
            contenido.fechaFinDisponibilidad,
        );


        const contenidosExistente = await this.contenidoCronogramaRepository.obtnerPorIdUnidadTemporal(
            contenido.idUnidadTemporal,
        );

        
        const nuevaAsociacionTentativa = ContenidoCronograma.crear(
            contenido.idContenido,
            contenido.idUnidadTemporal,
            0, 
            consistenciaFechas.fecha_inicio,
            consistenciaFechas.fecha_fin,
        );

        const nuevoOrden = this.reordenarContenidoTemporalService.recalcularOrden([
            ...contenidosExistente,
            nuevaAsociacionTentativa,
        ]);

        const ordenAsignado = nuevoOrden.find(
            (o) => o.id_contenido_cronograma === nuevaAsociacionTentativa.id_contenido_cronograma,
        )!.orden_contenido;


        this.validarSolapamientoTemporalService.validarSolapamiento(
            contenidosExistente,
            consistenciaFechas.fecha_inicio,
            consistenciaFechas.fecha_fin
        );

        if (
              consistenciaFechas.fecha_inicio < unidadTemporal.fecha_inicio ||
              consistenciaFechas.fecha_fin > unidadTemporal.fecha_fin
            ) {
              throw new DisponibilidadFueraDeRangoException();
            }

        const asociacionCronogramaUnidadTemporal = ContenidoCronograma.crear(
            contenido.idContenido,
            contenido.idUnidadTemporal,
            ordenAsignado,
            consistenciaFechas.fecha_inicio,
            consistenciaFechas.fecha_fin,
        );


       const ordenParaHermanas = nuevoOrden.filter(
            (o) => o.id_contenido_cronograma !== nuevaAsociacionTentativa.id_contenido_cronograma,
        );

        await this.contenidoCronogramaRepository.crearConReordenamiento(
            asociacionCronogramaUnidadTemporal,
            ordenParaHermanas,
        );

        return crearContenidoCronogramaDtoResponse.crear(ordenAsignado);
   
    }


}