import { Injectable } from '@nestjs/common';
import type { UmbralesDtoResponse } from '../../dto/configuracion/configuracion.dto-response';
import { ConfiguracionException } from '../../exceptions/configuracion.exception';
import {
  type UmbralVigente,
  UmbralesSeguimientoPort,
} from '../../ports/umbrales-seguimiento.port';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

/** RF-136: umbrales vigentes de M05 (RF-79), para mostrarlos antes de editar. */
@Injectable()
export class ConsultarUmbralesUseCase {
  constructor(private readonly umbrales: UmbralesSeguimientoPort) {}

  async execute(): Promise<UmbralesDtoResponse> {
    const items = await consultarFuenteConLimite<
      UmbralVigente[] | typeof M05_NO_DISPONIBLE
    >(() => this.umbrales.listarUmbrales(), M05_NO_DISPONIBLE);
    if (items === M05_NO_DISPONIBLE)
      throw ConfiguracionException.de('M05_NO_DISPONIBLE');
    return { items };
  }
}
