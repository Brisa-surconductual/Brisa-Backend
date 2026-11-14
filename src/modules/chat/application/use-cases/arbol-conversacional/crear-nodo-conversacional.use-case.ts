import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { CrearNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: agrega un nodo a un flujo en borrador. */
@Injectable()
export class CrearNodoConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearNodoConversacionalDtoRequest,
    idActor: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.obtenerFlujo(idFlujo);
      if (flujo === null) throw new FlujoConversacionalNoEncontradoException();
      flujo.asegurarEditable();

      const tipo = await this.repository.buscarTipoNodo(dto.id_tipo_nodo);
      if (tipo === null) throw new TipoNodoNoEncontradoException();

      if (dto.id_contenido_cronograma) {
        const existe = await this.repository.existeContenidoCronograma(
          dto.id_contenido_cronograma,
        );
        if (!existe) throw new ContenidoCronogramaNoEncontradoException();
      }

      const nodo = NodoConversacional.crear(
        idFlujo,
        tipo,
        dto.contenido,
        dto.es_nodo_inicial,
        dto.orden ?? null,
        dto.id_contenido_cronograma ?? null,
        idActor,
      );
      await this.repository.guardarNodo(nodo, idActor);
      return NodoConversacionalDtoResponse.crear(nodo);
    });
  }
}
