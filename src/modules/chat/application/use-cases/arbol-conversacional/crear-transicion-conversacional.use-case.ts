import { Injectable } from '@nestjs/common';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import {
  FlujoConversacionalNoEncontradoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TransicionConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { CrearTransicionConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { verificarNodosDelFlujo } from '../../support/verificar-nodos-del-flujo';

/**
 * RF-25: define una transición entre dos nodos del flujo. La regla de validación
 * es una regla existente o una nueva embebida en la solicitud (una sola de las
 * dos). Rechaza nodos ajenos al flujo y transiciones que cierren un ciclo.
 */
@Injectable()
export class CrearTransicionConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    dto: CrearTransicionConversacionalDtoRequest,
    idActor: string,
  ): Promise<TransicionConversacionalDtoResponse> {
    if (
      (dto.id_regla_validacion === undefined) ===
      (dto.regla_validacion === undefined)
    ) {
      throw new ReglaValidacionInvalidaException(
        'Debe indicar una regla existente o una regla embebida, exclusivamente.',
      );
    }
    // Una regla embebida inválida se rechaza antes de consultar la base de datos.
    const embebida =
      dto.regla_validacion === undefined
        ? undefined
        : ReglaValidacion.crear(
            dto.regla_validacion.tipo_dato,
            dto.regla_validacion.obligatorio,
            dto.regla_validacion.valor_min ?? null,
            dto.regla_validacion.valor_max ?? null,
            dto.regla_validacion.formato_regex ?? null,
            dto.regla_validacion.valores_permitidos,
            dto.regla_validacion.mensaje_error,
          );

    return ejecutarSeguro(async () => {
      const regla =
        embebida ??
        (await this.repository.buscarReglaValidacion(dto.id_regla_validacion!));
      if (regla === null) throw new ReglaValidacionNoEncontradaException();

      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      arbol.flujo.asegurarEditable();
      await verificarNodosDelFlujo(
        this.repository,
        idFlujo,
        dto.id_nodo_origen,
        dto.id_nodo_destino,
      );

      const transicion = TransicionConversacional.crear(
        idFlujo,
        dto.id_nodo_origen,
        dto.id_nodo_destino,
        dto.operador_condicion,
        dto.valor_condicion,
        dto.orden_evaluacion,
        regla,
      );
      arbol.conTransicion(transicion).validarAusenciaCiclos();

      await this.repository.guardarTransicion(transicion, idActor);
      return TransicionConversacionalDtoResponse.crear(transicion);
    });
  }
}
