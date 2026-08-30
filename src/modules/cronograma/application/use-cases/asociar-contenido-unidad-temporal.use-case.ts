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

@Injectable()
export class AsociarContenidoUnidadTemporalUseCase {
    constructor(
        private readonly calculoOrdenTemporalService: CalculoOrdenTemporalService,
        private readonly validarSolapamientoTemporalService: ValidarSolapamientoTemporalService,
        private readonly unidadTemporalRepository: UnidadTemporalRepository,
        private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
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

        const idCronograma = await this.unidadTemporalRepository.obtnerIdCronogramaPorIdUnidadTemporal(
            contenido.idUnidadTemporal,
        );
        

        const contenidosExistente = await this.contenidoCronogramaRepository.obtnerPorIdUnidadTemporal(
            contenido.idUnidadTemporal,
        );

        const ordenContenido = this.calculoOrdenTemporalService.calcularSiguienteOrden(contenidosExistente);
        
        this.validarSolapamientoTemporalService.validarSolapamiento(
            contenidosExistente,
            consistenciaFechas.fecha_inicio,
            consistenciaFechas.fecha_fin
        );

        const finalizacionUnidadTemporal = await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(
            contenido.idUnidadTemporal,
        );
        if (unidadTemporal.fecha_fin < new Date()) {
            throw new Error("La unidad temporal ya ha finalizado no se puede asociar contenido");
        }

        const asociacionCronogramaUnidadTemporal = ContenidoCronograma.crear(
            contenido.idContenido,
            contenido.idUnidadTemporal,
            idCronograma,
            ordenContenido,
            consistenciaFechas.fecha_inicio,
            consistenciaFechas.fecha_fin,
        );

       await this.contenidoCronogramaRepository.crear(asociacionCronogramaUnidadTemporal);

        return crearContenidoCronogramaDtoResponse.crear(ordenContenido);
    }


}