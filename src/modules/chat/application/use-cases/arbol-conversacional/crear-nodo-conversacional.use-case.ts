import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import { normalizarContenidoNodo } from '../../../domain/policies/contenido-nodo.policy';
import { NodoFinalPolicy } from '../../../domain/policies/nodo-final.policy';
import { OrdenNodoPolicy } from '../../../domain/policies/orden-nodo.policy';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { CrearNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { VariableNodoService } from '../../services/variable-nodo.service';

/** RF-25: agrega un nodo a un flujo en borrador (inicial, intermedio o final). */
@Injectable()
export class CrearNodoConversacionalUseCase {
  private readonly ordenPolicy = new OrdenNodoPolicy();
  private readonly finalPolicy = new NodoFinalPolicy();

  constructor(
    private readonly repository: ArbolConversacionalRepository,
    private readonly variables: VariableNodoService,
  ) {}

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

      if (dto.id_contenido) {
        const existe = await this.repository.existeContenido(dto.id_contenido);
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
        normalizarContenidoNodo(dto.contenido),
        dto.es_nodo_inicial,
        dto.orden,
        dto.id_contenido ?? null,
        idActor,
        dto.es_nodo_final ?? false,
      );
      this.finalPolicy.validar(nodo, false);
      // RF-30B: la variable del nodo filtra su tipo de respuesta.
      await this.variables.validar(nodo);
      await this.repository.guardarNodo(nodo, idActor);
      return NodoConversacionalDtoResponse.crear(nodo);
    });
  }
}
