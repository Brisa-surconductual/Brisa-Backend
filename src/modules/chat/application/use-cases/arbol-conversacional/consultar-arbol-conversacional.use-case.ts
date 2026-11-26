import { Injectable } from '@nestjs/common';
import { FlujoConversacionalNoEncontradoException } from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ArbolConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: devuelve el flujo con todos sus nodos y transiciones. */
@Injectable()
export class ConsultarArbolConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<ArbolConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      return ArbolConversacionalDtoResponse.crear(arbol);
    });
  }
}
