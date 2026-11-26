import { Injectable } from '@nestjs/common';
import { TaxonomiaVariablesRepository } from '../../../domain/repositories/taxonomia-variables.repository';
import { TaxonomiaVariablesDtoResponse } from '../../dto/taxonomia/taxonomia-variables.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-30B: taxonomía vigente para el editor de árboles. Por defecto solo las
 * variables habilitadas, que son las que se pueden asignar a un nodo.
 */
@Injectable()
export class ConsultarTaxonomiaVariablesUseCase {
  constructor(private readonly repository: TaxonomiaVariablesRepository) {}

  execute(
    incluirDeshabilitadas = false,
  ): Promise<TaxonomiaVariablesDtoResponse> {
    return ejecutarSeguro(async () => {
      const [version, variables] = await Promise.all([
        this.repository.versionActual(),
        this.repository.listar(incluirDeshabilitadas),
      ]);
      return TaxonomiaVariablesDtoResponse.crear(version, variables);
    });
  }
}
