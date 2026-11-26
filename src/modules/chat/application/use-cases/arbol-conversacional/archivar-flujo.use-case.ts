import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  FlujoConversacionalNoEncontradoException,
  FlujoPersonalizadoYaArchivadoException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25C: archiva un flujo en lugar de eliminarlo (la eliminación física no está permitida). */
@Injectable()
export class ArchivarFlujoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    idFlujo: string,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.obtenerFlujo(idFlujo);
      if (flujo === null) throw new FlujoConversacionalNoEncontradoException();
      if (
        flujo.estaArchivado &&
        flujo.modalidad === ModalidadConversacional.PERSONALIZADA
      ) {
        throw new FlujoPersonalizadoYaArchivadoException();
      }

      const archivado = flujo.archivar();
      await this.repository.guardarFlujo(archivado, idActor);
      return FlujoConversacionalDtoResponse.crear(archivado);
    });
  }
}
