import { Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { CatalogosChatDtoResponse } from '../../dto/chat-admin.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: catálogos necesarios para armar un árbol (tipos de nodo y entrada, reglas, enums). */
@Injectable()
export class ConsultarCatalogosChatUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<CatalogosChatDtoResponse> {
    return ejecutarSeguro(async () => {
      const [tiposNodo, tiposEntrada, reglas, contenidosCronograma] =
        await Promise.all([
          this.repository.listarTiposNodo(),
          this.repository.listarTiposEntrada(),
          this.repository.listarReglasValidacion(),
          this.repository.listarContenidosCronograma(),
        ]);
      return CatalogosChatDtoResponse.crear(
        tiposNodo,
        tiposEntrada,
        reglas,
        contenidosCronograma,
      );
    });
  }
}
