import { Injectable } from '@nestjs/common';
import {
  FlujoConversacionalNoEncontradoException,
  TransicionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { construirReglaTransicion } from '../../../domain/policies/regla-por-tipo-entrada';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TransicionConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ActualizarTransicionConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { solicitudReglaTransicion } from '../../support/solicitud-regla-transicion';
import { verificarNodosDelFlujo } from '../../support/verificar-nodos-del-flujo';

/**
 * RF-25: edita parcialmente una transición de un flujo en borrador. Su regla
 * es propia: si se envía, se reconstruye completa desde el nodo origen y la
 * anterior se descarta. El flujo se deduce de la transición.
 */
@Injectable()
export class ActualizarTransicionConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idTransicion: string,
    dto: ActualizarTransicionConversacionalDtoRequest,
    idActor: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    if (Object.values(dto).every((valor) => valor === undefined)) {
      throw new SolicitudActualizacionVaciaException();
    }

    return ejecutarSeguro(async () => {
      const encontrada = await this.repository.buscarTransicion(idTransicion);
      if (encontrada === null) {
        throw new TransicionConversacionalNoEncontradaException();
      }

      const arbol = await this.repository.obtenerArbol(encontrada.idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      arbol.flujo.asegurarEditable();
      const { origen } = await verificarNodosDelFlujo(
        this.repository,
        encontrada.idFlujo,
        encontrada.idNodoOrigen,
        dto.id_nodo_destino ?? encontrada.idNodoDestino,
      );

      const transicion = encontrada.actualizar({
        idNodoDestino: dto.id_nodo_destino,
        ordenEvaluacion: dto.orden_evaluacion,
        reglaValidacion:
          dto.regla_validacion === undefined
            ? undefined
            : construirReglaTransicion(
                origen.contenido,
                solicitudReglaTransicion(dto.regla_validacion),
              ),
      });
      arbol.conTransicion(transicion).validarAusenciaCiclos();

      await this.repository.guardarTransicion(transicion, idActor);
      return TransicionConversacionalDtoResponse.crear(transicion);
    });
  }
}
