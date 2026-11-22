import { Injectable } from '@nestjs/common';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEncontradoException,
  NodoConversacionalNoEncontradoException,
  TipoNodoNoEncontradoException,
  TransicionesAfectadasException,
} from '../../../domain/exceptions';
import {
  cambiaTipoRespuesta,
  normalizarContenidoNodo,
} from '../../../domain/policies/contenido-nodo.policy';
import { NodoFinalPolicy } from '../../../domain/policies/nodo-final.policy';
import { OrdenNodoPolicy } from '../../../domain/policies/orden-nodo.policy';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ActualizarNodoConversacionalDtoRequest } from '../../dto/arbol-conversacional.dto-request';
import { NodoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { SolicitudActualizacionVaciaException } from '../../exceptions/solicitud-actualizacion-vacia.exception';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25: edita parcialmente un nodo de un flujo en borrador; el flujo se deduce
 * del nodo. Si cambia el tipo de respuesta y el nodo tiene transiciones de
 * salida, exige confirmación (`eliminar_transiciones_afectadas`) y luego las
 * elimina en la misma transacción: sus reglas ya no tienen sentido.
 */
@Injectable()
export class ActualizarNodoConversacionalUseCase {
  private readonly ordenPolicy = new OrdenNodoPolicy();
  private readonly finalPolicy = new NodoFinalPolicy();

  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idNodo: string,
    dto: ActualizarNodoConversacionalDtoRequest,
    idActor: string,
  ): Promise<NodoConversacionalDtoResponse> {
    const { eliminar_transiciones_afectadas: confirmaEliminar, ...cambios } =
      dto;
    if (Object.values(cambios).every((valor) => valor === undefined)) {
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

      if (typeof dto.id_contenido === 'string') {
        const existe = await this.repository.existeContenido(dto.id_contenido);
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
          contenido:
            dto.contenido === undefined
              ? undefined
              : normalizarContenidoNodo(dto.contenido),
          esNodoInicial: dto.es_nodo_inicial,
          esNodoFinal: dto.es_nodo_final,
          orden: dto.orden,
          idContenido: dto.id_contenido,
        },
        tipo,
      );

      const salidas = arbol.transicionesDeOrigen(existente.idNodo);
      const afectadas = cambiaTipoRespuesta(existente.contenido, nodo.contenido)
        ? salidas
        : [];
      if (afectadas.length > 0 && confirmaEliminar !== true) {
        throw new TransicionesAfectadasException({
          transiciones: afectadas.map((t) => ({
            id_regla: t.idTransicion,
            id_nodo_destino: t.idNodoDestino,
            orden_evaluacion: t.ordenEvaluacion,
          })),
        });
      }
      this.finalPolicy.validar(nodo, salidas.length > afectadas.length);

      await this.repository.guardarNodo(nodo, idActor, afectadas);
      return NodoConversacionalDtoResponse.crear(nodo);
    });
  }
}
