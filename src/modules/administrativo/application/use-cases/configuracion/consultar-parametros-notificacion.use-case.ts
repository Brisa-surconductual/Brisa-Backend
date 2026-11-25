import { Injectable } from '@nestjs/common';
import type { ParametrosNotificacionDtoResponse } from '../../dto/configuracion/configuracion.dto-response';
import { ConfiguracionException } from '../../exceptions/configuracion.exception';
import {
  type ParametrosNotificacion,
  ParametrosNotificacionPort,
} from '../../ports/parametros-notificacion.port';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';

const M07_NO_DISPONIBLE = Symbol('m07-no-disponible');

/**
 * RF-137: los tres parámetros globales vigentes de M07 (RF-87, RF-88, RF-89),
 * agrupados en una sola vista para mostrarlos antes de editar.
 */
@Injectable()
export class ConsultarParametrosNotificacionUseCase {
  constructor(private readonly parametros: ParametrosNotificacionPort) {}

  async execute(): Promise<ParametrosNotificacionDtoResponse> {
    const vigentes = await consultarFuenteConLimite<
      ParametrosNotificacion | typeof M07_NO_DISPONIBLE
    >(() => this.parametros.obtenerParametros(), M07_NO_DISPONIBLE);
    if (vigentes === M07_NO_DISPONIBLE)
      throw ConfiguracionException.de('M07_NO_DISPONIBLE');
    return vigentes;
  }
}
