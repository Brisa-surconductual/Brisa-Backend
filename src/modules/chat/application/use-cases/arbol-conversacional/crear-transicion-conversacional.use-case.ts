import { Injectable } from '@nestjs/common';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { FlujoConversacionalNoEncontradoException } from '../../../domain/exceptions';
import { construirReglaTransicion } from '../../../domain/policies/regla-por-tipo-entrada';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TransicionConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { CrearTransicionConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { solicitudReglaTransicion } from '../../support/solicitud-regla-transicion';
import { verificarNodosDelFlujo } from '../../support/verificar-nodos-del-flujo';

/**
 * RF-25: define una transición entre dos nodos del flujo con su propia regla
 * (nunca compartida), derivada del tipo de respuesta del nodo origen. Rechaza
 * nodos ajenos al flujo y transiciones que cierren un ciclo.
 */
@Injectable()
export class CrearTransicionConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearTransicionConversacionalDtoRequest,
    idActor: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      arbol.flujo.asegurarEditable();
      const { origen } = await verificarNodosDelFlujo(
        this.repository,
        idFlujo,
        dto.id_nodo_origen,
        dto.id_nodo_destino,
      );
      const regla = construirReglaTransicion(
        origen.contenido,
        solicitudReglaTransicion(dto.regla_validacion),
      );

      const transicion = TransicionConversacional.crear(
        idFlujo,
        dto.id_nodo_origen,
        dto.id_nodo_destino,
        dto.orden_evaluacion,
        regla,
      );
      arbol.conTransicion(transicion).validarAusenciaCiclos();

      await this.repository.guardarTransicion(transicion, idActor);
      return TransicionConversacionalDtoResponse.crear(transicion);
    });
  }
}
