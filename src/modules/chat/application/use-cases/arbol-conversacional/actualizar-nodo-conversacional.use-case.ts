import { Injectable } from '@nestjs/common';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEncontradoException,
  NodoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import { OrdenNodoPolicy } from '../../../domain/policies/orden-nodo.policy';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ActualizarNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: edita parcialmente un nodo de un flujo en borrador; el flujo se deduce del nodo. */
@Injectable()
export class ActualizarNodoConversacionalUseCase {
  private readonly ordenPolicy = new OrdenNodoPolicy();

  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idNodo: string,
    dto: ActualizarNodoConversacionalDtoRequest,
    idActor: string,
  ): Promise<NodoConversacionalDtoResponse> {
    if (Object.values(dto).every((valor) => valor === undefined)) {
      throw new SolicitudActualizacionVaciaException();
    }

    return ejecutarSeguro(async () => {
      const existente = await this.repository.buscarNodo(idNodo);
      if (existente === null) {
        throw new NodoConversacionalNoEncontradoException();
      }
      const arbol = await this.repository.obtenerArbol(existente.idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      arbol.flujo.asegurarEditable();

      const tipo =
        dto.id_tipo_nodo === undefined
          ? undefined
          : await this.repository.buscarTipoNodo(dto.id_tipo_nodo);
      if (tipo === null) throw new TipoNodoNoEncontradoException();

      if (typeof dto.id_contenido_cronograma === 'string') {
        const existe = await this.repository.existeContenidoCronograma(
          dto.id_contenido_cronograma,
        );
        if (!existe) throw new ContenidoCronogramaNoEncontradoException();
      }

      if (dto.orden !== undefined || dto.es_nodo_inicial !== undefined) {
        const ordenResuelto =
          dto.orden === undefined ? existente.orden : dto.orden;
        const esNodoInicialResuelto =
          dto.es_nodo_inicial ?? existente.esNodoInicial;

        this.ordenPolicy.validar(
          arbol.nodos,
          existente.idNodo,
          ordenResuelto,
          esNodoInicialResuelto,
        );
      }

      const nodo = existente.actualizar(
        {
          contenido: dto.contenido,
          esNodoInicial: dto.es_nodo_inicial,
          orden: dto.orden,
          idContenidoCronograma: dto.id_contenido_cronograma,
        },
        tipo,
      );
      await this.repository.guardarNodo(nodo, idActor);
      return NodoConversacionalDtoResponse.crear(nodo);
    });
  }
}
