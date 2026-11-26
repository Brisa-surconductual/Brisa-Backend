import { Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { HistorialArbolesPersonalizadosDtoResponse } from '../../dto/arbol-personalizado.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25C: las cuatro combinaciones de perfil con su árbol publicado e historial de versiones. */
@Injectable()
export class ListarArbolesPersonalizadosUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(): Promise<HistorialArbolesPersonalizadosDtoResponse> {
    return ejecutarSeguro(async () =>
      HistorialArbolesPersonalizadosDtoResponse.crear(
        await this.repository.listarFlujosPersonalizados(),
      ),
    );
  }
}
