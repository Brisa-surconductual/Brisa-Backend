import { Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { TipoNodoDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25: tipos de nodo disponibles para armar un árbol. */
@Injectable()
export class ListarTiposNodoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<TipoNodoDtoResponse[]> {
    return ejecutarSeguro(async () =>
      (await this.repository.listarTiposNodo()).map((tipo) =>
        TipoNodoDtoResponse.crear(tipo),
      ),
    );
  }
}
