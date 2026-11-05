import { Injectable } from '@nestjs/common';
import {
  FlujoConversacionalNoEncontradoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
  TransicionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TransicionConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ActualizarTransicionConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';
import { verificarNodosDelFlujo } from '../../support/verificar-nodos-del-flujo';

/**
 * RF-25: edita parcialmente una transición de un flujo en borrador. Su regla de
 * validación se puede sustituir por otra existente o editar; si la regla la
 * comparten varias transiciones, se edita una copia. El flujo se deduce de la
 * transición.
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
      await verificarNodosDelFlujo(
        this.repository,
        encontrada.idFlujo,
        encontrada.idNodoOrigen,
        dto.id_nodo_destino ?? encontrada.idNodoDestino,
      );

      if (
        dto.id_regla_validacion !== undefined &&
        dto.regla_validacion !== undefined
      ) {
        throw new ReglaValidacionInvalidaException(
          'No se puede sustituir una regla y editar su definición simultáneamente.',
        );
      }

      let regla = encontrada.reglaValidacion;
      if (dto.id_regla_validacion !== undefined) {
        const sustituta = await this.repository.buscarReglaValidacion(
          dto.id_regla_validacion,
        );
        if (sustituta === null)
          throw new ReglaValidacionNoEncontradaException();
        regla = sustituta;
      } else if (dto.regla_validacion !== undefined) {
        const cambios = dto.regla_validacion;
        const compartida =
          (await this.repository.contarUsosReglaValidacion(
            regla.idReglaValidacion,
          )) > 1;
        regla = (compartida ? regla.copiar() : regla).modificar({
          tipoDato: cambios.tipo_dato,
          obligatorio: cambios.obligatorio,
          valorMin: cambios.valor_min,
          valorMax: cambios.valor_max,
          formatoRegex: cambios.formato_regex,
          valoresPermitidos: cambios.valores_permitidos,
          mensajeError: cambios.mensaje_error,
        });
      }

      const transicion = encontrada.actualizar({
        idNodoDestino: dto.id_nodo_destino,
        operadorCondicion: dto.operador_condicion,
        valorCondicion: dto.valor_condicion,
        ordenEvaluacion: dto.orden_evaluacion,
        reglaValidacion: regla,
      });
      arbol.conTransicion(transicion).validarAusenciaCiclos();

      await this.repository.guardarTransicion(transicion, idActor);
      return TransicionConversacionalDtoResponse.crear(transicion);
    });
  }
}
