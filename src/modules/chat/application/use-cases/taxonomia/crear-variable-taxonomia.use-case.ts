import { Injectable } from '@nestjs/common';
import { VariableTaxonomia } from '../../../domain/entities/taxonomia/variable-taxonomia.entity';
import { AccionAuditoriaArbol } from '../../../domain/enums/accion-auditoria-arbol.enum';
import { VariableDuplicadaException } from '../../../domain/exceptions/taxonomia.exceptions';
import { TaxonomiaVariablesRepository } from '../../../domain/repositories/taxonomia-variables.repository';
import { CrearVariableTaxonomiaDtoRequest } from '../../dto/taxonomia/taxonomia-variables.dto-request';
import { EscrituraVariableTaxonomiaDtoResponse } from '../../dto/taxonomia/taxonomia-variables.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-30B: el equipo de psicología agrega una variable a la taxonomía. La
 * variable, la nueva versión y la auditoría se confirman juntas.
 */
@Injectable()
export class CrearVariableTaxonomiaUseCase {
  constructor(private readonly repository: TaxonomiaVariablesRepository) {}

  execute(
    dto: CrearVariableTaxonomiaDtoRequest,
    idActor: string,
  ): Promise<EscrituraVariableTaxonomiaDtoResponse> {
    return ejecutarSeguro(async () => {
      const nueva = VariableTaxonomia.crear({
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        tipoValor: dto.tipo_valor,
        valores: dto.valores ?? null,
        tiposEntradaPermitidos: dto.tipos_entrada_permitidos,
        etiquetas: dto.etiquetas,
      });
      return this.repository.ejecutar(async (tx) => {
        if (await tx.existeCodigo(nueva.codigo))
          throw new VariableDuplicadaException();
        const creada = await tx.insertar(nueva, idActor);
        const version = await tx.registrarVersion(
          AccionAuditoriaArbol.CREAR_VARIABLE_TAXONOMIA,
          creada,
          idActor,
        );
        return EscrituraVariableTaxonomiaDtoResponse.crear(version, creada);
      });
    });
  }
}
