import { Injectable } from '@nestjs/common';
import { AccionAuditoriaArbol } from '../../../domain/enums/accion-auditoria-arbol.enum';
import { VariableNoEncontradaException } from '../../../domain/exceptions/taxonomia.exceptions';
import { TaxonomiaVariablesRepository } from '../../../domain/repositories/taxonomia-variables.repository';
import { EscrituraVariableTaxonomiaDtoResponse } from '../../dto/taxonomia/taxonomia-variables.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-30B: habilita o deshabilita una variable. No se deshabilita una variable
 * que capturan nodos de un flujo publicado. Pedir el estado que ya tiene no
 * cambia nada ni sube la versión.
 */
@Injectable()
export class CambiarEstadoVariableTaxonomiaUseCase {
  constructor(private readonly repository: TaxonomiaVariablesRepository) {}

  execute(
    codigo: string,
    habilitada: boolean,
    idActor: string,
  ): Promise<EscrituraVariableTaxonomiaDtoResponse> {
    return ejecutarSeguro(() =>
      this.repository.ejecutar(async (tx) => {
        const actual = await tx.bloquearPorCodigo(codigo);
        if (actual === null) throw new VariableNoEncontradaException();
        if (actual.habilitada === habilitada)
          return EscrituraVariableTaxonomiaDtoResponse.crear(
            await tx.versionActual(),
            actual,
          );

        const cambiada = habilitada
          ? actual.habilitar()
          : actual.deshabilitar(await tx.estaEnUsoPublicado(codigo));
        await tx.actualizarEstado(cambiada);
        const version = await tx.registrarVersion(
          habilitada
            ? AccionAuditoriaArbol.HABILITAR_VARIABLE_TAXONOMIA
            : AccionAuditoriaArbol.DESHABILITAR_VARIABLE_TAXONOMIA,
          cambiada,
          idActor,
        );
        return EscrituraVariableTaxonomiaDtoResponse.crear(version, cambiada);
      }),
    );
  }
}
