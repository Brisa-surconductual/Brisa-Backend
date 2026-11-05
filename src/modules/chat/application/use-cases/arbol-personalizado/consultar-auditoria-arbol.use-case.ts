import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { FlujoPersonalizadoNoEncontradoException } from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { AuditoriaArbolDtoResponse } from '../../dto/arbol-personalizado.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25C: historial de operaciones (creación, edición, publicación, archivado) de un árbol personalizado. */
@Injectable()
export class ConsultarAuditoriaArbolUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(idFlujo: string): Promise<AuditoriaArbolDtoResponse[]> {
    return ejecutarSeguro(async () => {
      const flujo = await this.repository.obtenerFlujo(idFlujo);
      if (
        flujo === null ||
        flujo.modalidad !== ModalidadConversacional.PERSONALIZADA
      ) {
        throw new FlujoPersonalizadoNoEncontradoException();
      }
      return (await this.repository.listarAuditoriaArbol(idFlujo)).map(
        (registro) => AuditoriaArbolDtoResponse.crear(registro),
      );
    });
  }
}
