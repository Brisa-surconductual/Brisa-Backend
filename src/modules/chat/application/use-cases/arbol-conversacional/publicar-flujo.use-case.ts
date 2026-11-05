import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoArchivadoException,
  GrafoInvalidoException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25 / RF-25C: publica un borrador cuya estructura sea válida.
 * En modalidad personalizada archiva automáticamente el publicado anterior de
 * la misma combinación de perfil; en grupal solo puede haber un publicado.
 */
@Injectable()
export class PublicarFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const arbol = await this.repository.obtenerArbol(idFlujo);
      if (arbol === null) throw new FlujoConversacionalNoEncontradoException();

      const esPersonalizado =
        arbol.flujo.modalidad === ModalidadConversacional.PERSONALIZADA;
      if (esPersonalizado && arbol.flujo.estaArchivado) {
        throw new FlujoPersonalizadoArchivadoException();
      }
      const ahora = new Date();
      const publicado = arbol.flujo.publicar(ahora);

      const diagnostico = arbol.diagnosticarEstructura();
      if (
        diagnostico.sin_nodo_inicial ||
        diagnostico.nodos_huerfanos.length > 0 ||
        diagnostico.ciclos.length > 0
      ) {
        throw new GrafoInvalidoException(diagnostico);
      }

      if (esPersonalizado) {
        const perfil = publicado.perfilClinico();
        const anterior = await this.repository.buscarPublicadoPersonalizado(
          perfil.tipoDependencia,
          perfil.tipoCraving,
        );
        // El anterior se archiva primero para respetar el índice de publicado único.
        await this.repository.guardarFlujos(
          anterior === null
            ? [publicado]
            : [anterior.archivar(ahora), publicado],
          idActor,
        );
      } else {
        if ((await this.repository.buscarPublicadoGrupal()) !== null) {
          throw new FlujoGrupalPublicadoExistenteException();
        }
        await this.repository.guardarFlujo(publicado, idActor);
      }
      return FlujoConversacionalDtoResponse.crear(publicado);
    });
  }
}
