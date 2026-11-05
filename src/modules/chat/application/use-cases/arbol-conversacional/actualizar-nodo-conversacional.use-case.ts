import { Injectable } from '@nestjs/common';
import {
  FlujoConversacionalNoEncontradoException,
  NodoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ActualizarNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: edita parcialmente un nodo de un flujo en borrador; el flujo se deduce del nodo. */
@Injectable()
export class ActualizarNodoConversacionalUseCase {
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
      const flujo = await this.repository.obtenerFlujo(existente.idFlujo);
      if (flujo === null) throw new FlujoConversacionalNoEncontradoException();
      flujo.asegurarEditable();

      const tipo =
        dto.id_tipo_nodo === undefined
          ? undefined
          : await this.repository.buscarTipoNodo(dto.id_tipo_nodo);
      if (tipo === null) throw new TipoNodoNoEncontradoException();

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
