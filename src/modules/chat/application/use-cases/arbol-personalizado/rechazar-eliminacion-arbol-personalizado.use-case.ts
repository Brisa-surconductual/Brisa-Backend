import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  EliminacionArbolPersonalizadoProhibidaException,
  FlujoPersonalizadoNoEncontradoException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25C: la eliminación física de árboles personalizados no está permitida;
 * se indica archivar. (Primera etapa: aún no existe borrado de borradores.)
 */
@Injectable()
export class RechazarEliminacionArbolPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<never> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.obtenerFlujo(idFlujo);
      if (
        flujo === null ||
        flujo.modalidad !== ModalidadConversacional.PERSONALIZADA
      ) {
        throw new FlujoPersonalizadoNoEncontradoException();
      }
      throw new EliminacionArbolPersonalizadoProhibidaException();
    });
  }
}
