import { Injectable } from '@nestjs/common';
import { FlujoConversacionalNoEncontradoException } from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ValidacionArbolDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25 / RF-25C: valida la estructura (nodo inicial, sin ciclos, sin nodos
 * huérfanos) sin modificar el árbol.
 */
@Injectable()
export class ValidarArbolConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<ValidacionArbolDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();
      return ValidacionArbolDtoResponse.crear(arbol.validarEstructura());
    });
  }
}
