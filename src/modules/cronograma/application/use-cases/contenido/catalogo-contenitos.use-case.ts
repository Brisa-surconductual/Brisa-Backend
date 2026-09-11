import { Injectable } from "@nestjs/common";
import { ContenidosExitentesDtoResponse } from "../../dto/contenido/contenidos-exitentes.dto-response";
import { ContenidoRepository } from "../../../domain/repositories/contenido.repository";
import { ContenidoCronogramaRepository } from "../../../domain/repositories/contenido-cronograma.repository";

@Injectable()
export class CatologoContenitosUseCase {

    constructor(
        private readonly contenidoRepository: ContenidoRepository, 
        private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository
    ) {}

    async execute(): Promise<ContenidosExitentesDtoResponse[]> {

        const contenidos = await this.contenidoRepository.listar();

        const contenidosConAsociacion = await Promise.all(
            contenidos.map(async (contenido) => ({
                contenido,
                asociacion: await this.contenidoCronogramaRepository.obtenerPorIdContenido(
                    contenido.id_contenido,
                ),
            })),
        );

        return contenidosConAsociacion.map(({ contenido, asociacion }) =>
            ContenidosExitentesDtoResponse.fromEntity(contenido, asociacion),
        );
    }
}