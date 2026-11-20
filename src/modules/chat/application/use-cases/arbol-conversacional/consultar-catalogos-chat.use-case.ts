import { Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { CatalogosChatDtoResponse } from '../../dto/chat-admin.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25: catálogos necesarios para armar un árbol (tipos de nodo y entrada,
 * contenido programado, enums). No hay catálogo de reglas: cada transición
 * define la suya.
 */
@Injectable()
export class ConsultarCatalogosChatUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<CatalogosChatDtoResponse> {
    return ejecutarSeguro(async () => {
      const [tiposNodo, tiposEntrada, contenidosCronograma] = await Promise.all(
        [
          this.repository.listarTiposNodo(),
          this.repository.listarTiposEntrada(),
          this.repository.listarContenidosCronograma(),
        ],
      );
      return CatalogosChatDtoResponse.crear(
        tiposNodo,
        tiposEntrada,
        contenidosCronograma,
      );
    });
  }
}
