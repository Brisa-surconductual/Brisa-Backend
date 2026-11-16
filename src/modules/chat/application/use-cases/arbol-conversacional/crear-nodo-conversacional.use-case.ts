import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import { OrdenNodoPolicy } from '../../../domain/policies/orden-nodo.policy';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { CrearNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: agrega un nodo a un flujo en borrador. */
@Injectable()
export class CrearNodoConversacionalUseCase {
  private readonly ordenPolicy = new OrdenNodoPolicy();

  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearNodoConversacionalDtoRequest,
    idActor: string,
  ): Promise<NodoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      arbol.flujo.asegurarEditable();

      const tipo = await this.repository.buscarTipoNodo(dto.id_tipo_nodo);
      if (tipo === null) throw new TipoNodoNoEncontradoException();

      if (dto.id_contenido_cronograma) {
        const existe = await this.repository.existeContenidoCronograma(
          dto.id_contenido_cronograma,
        );
        if (!existe) throw new ContenidoCronogramaNoEncontradoException();
      }

      this.ordenPolicy.validar(
        arbol.nodos,
        null,
        dto.orden,
        dto.es_nodo_inicial,
      );

      const nodo = NodoConversacional.crear(
        idFlujo,
        tipo,
        dto.contenido,
        dto.es_nodo_inicial,
        dto.orden,
        dto.id_contenido_cronograma ?? null,
        idActor,
      );
      await this.repository.guardarNodo(nodo, idActor);
      return NodoConversacionalDtoResponse.crear(nodo);
    });
  }
}
