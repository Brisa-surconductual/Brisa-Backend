import { Injectable } from '@nestjs/common';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import {
  FlujoConversacionalNoEncontradoException,
  ReglaValidacionInvalidaException,
  TransicionPorDefectoDuplicadaException,
} from '../../../domain/exceptions';
import {
  construirReglaPorDefecto,
  construirReglaTransicion,
} from '../../../domain/policies/regla-por-tipo-entrada';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TransicionConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { CrearTransicionConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { reorganizarTransicionesOrigen } from '../../support/reorganizar-transiciones-origen';
import { solicitudReglaTransicion } from '../../support/solicitud-regla-transicion';
import { verificarNodosDelFlujo } from '../../support/verificar-nodos-del-flujo';

/**
 * RF-25: define una transición entre dos nodos del flujo con su propia regla
 * (nunca compartida), derivada del tipo de respuesta del nodo origen. Rechaza
 * nodos ajenos al flujo, autorreferencias y transiciones que cierren un ciclo.
 *
 * Con `id_nodo_destino_otro` también crea (o redirige) la transición
 * "cualquier otra respuesta" (SIEMPRE) del origen, que siempre queda última.
 * Sin `orden_evaluacion`, la transición toma el siguiente orden libre.
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
      const solicitud = solicitudReglaTransicion(dto.regla_validacion);
      const esPorDefecto = solicitud?.operador === OperadorCondicion.SIEMPRE;
      if (esPorDefecto && dto.id_nodo_destino_otro !== undefined)
        throw new ReglaValidacionInvalidaException(
          'La transición para "cualquier otra respuesta" no define otro destino.',
        );
      if (esPorDefecto && arbol.transicionPorDefecto(origen.idNodo) !== null)
        throw new TransicionPorDefectoDuplicadaException();

      const transicion = TransicionConversacional.crear(
        idFlujo,
        origen.idNodo,
        dto.id_nodo_destino,
        dto.orden_evaluacion ?? arbol.siguienteOrdenEvaluacion(origen.idNodo),
        construirReglaTransicion(origen.contenido, solicitud),
      );
      const cambios = [transicion];

      if (dto.id_nodo_destino_otro !== undefined) {
        await verificarNodosDelFlujo(
          this.repository,
          idFlujo,
          origen.idNodo,
          dto.id_nodo_destino_otro,
        );
        const existente = arbol.transicionPorDefecto(origen.idNodo);
        cambios.push(
          existente === null
            ? TransicionConversacional.crear(
                idFlujo,
                origen.idNodo,
                dto.id_nodo_destino_otro,
                // Provisional: la reorganización la deja última.
                Number.MAX_SAFE_INTEGER,
                construirReglaPorDefecto(origen.contenido),
              )
            : existente.actualizar({ idNodoDestino: dto.id_nodo_destino_otro }),
        );
      }

      const { arbol: resultado, aGuardar } = reorganizarTransicionesOrigen(
        arbol,
        origen.idNodo,
        cambios,
      );
      await this.repository.guardarTransiciones(aGuardar, idActor);

      const guardada =
        resultado.transiciones.find(
          (t) => t.idTransicion === transicion.idTransicion,
        ) ?? transicion;
      const porDefecto = resultado.transicionPorDefecto(origen.idNodo);
      return {
        ...TransicionConversacionalDtoResponse.crear(guardada),
        transicion_por_defecto:
          porDefecto === null ||
          porDefecto.idTransicion === guardada.idTransicion
            ? null
            : TransicionConversacionalDtoResponse.crear(porDefecto),
      };
    });
  }
}
