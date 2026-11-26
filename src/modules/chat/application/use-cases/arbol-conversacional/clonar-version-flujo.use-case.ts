import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  VersionPersonalizadaNoClonableException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ClonacionFlujoDtoResponse } from '../../dto/gestion-flujos.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25C: crea una nueva versión en borrador a partir de un flujo ya publicado
 * o archivado, copiando nodos, transiciones y reglas con identificadores nuevos.
 */
@Injectable()
export class ClonarVersionFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<ClonacionFlujoDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();

      const esPersonalizado =
        arbol.flujo.modalidad === ModalidadConversacional.PERSONALIZADA;
      if (arbol.flujo.esEditable) {
        throw esPersonalizado
          ? new VersionPersonalizadaNoClonableException()
          : new EstadoFlujoInvalidoException();
      }

      let version = arbol.flujo.version + 1;
      if (esPersonalizado) {
        const perfil = arbol.flujo.perfilClinico();
        version =
          (await this.repository.obtenerUltimaVersionPersonalizada(
            perfil.tipoDependencia,
            perfil.tipoCraving,
          )) + 1;
      }

      const clon = arbol.clonar(version, idActor);
      await this.repository.guardarArbolClonado(clon, idFlujo, idActor);
      return ClonacionFlujoDtoResponse.crear(clon, idFlujo);
    });
  }
}
