import {
  ReglasEtiqueta,
  VariableTaxonomia,
} from '../../../domain/entities/taxonomia/variable-taxonomia.entity';
import { TipoEntradaRespuesta } from '../../../domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable } from '../../../domain/enums/tipo-valor-variable.enum';
import { VariableTaxonomiaConUso } from '../../../domain/repositories/taxonomia-variables.repository';
import { VersionTaxonomia } from '../../../domain/value-objects/version-taxonomia.vo';

export class VariableTaxonomiaDtoResponse {
  codigo!: string;
  nombre!: string;
  descripcion!: string | null;
  tipo_valor!: TipoValorVariable;
  valores!: readonly string[] | null;
  tipos_entrada_permitidos!: readonly TipoEntradaRespuesta[];
  etiquetas!: ReglasEtiqueta;
  habilitada!: boolean;
  en_uso_publicado?: boolean;

  static crear(
    variable: VariableTaxonomia,
    enUsoPublicado?: boolean,
  ): VariableTaxonomiaDtoResponse {
    return {
      codigo: variable.codigo,
      nombre: variable.nombre,
      descripcion: variable.descripcion,
      tipo_valor: variable.tipoValor,
      valores: variable.valores,
      tipos_entrada_permitidos: variable.tiposEntradaPermitidos,
      etiquetas: variable.etiquetas,
      habilitada: variable.habilitada,
      ...(enUsoPublicado === undefined
        ? {}
        : { en_uso_publicado: enUsoPublicado }),
    };
  }
}

/** GET: versión global y variables. */
export class TaxonomiaVariablesDtoResponse {
  version!: string;
  variables!: VariableTaxonomiaDtoResponse[];

  static crear(
    version: VersionTaxonomia,
    variables: VariableTaxonomiaConUso[],
  ): TaxonomiaVariablesDtoResponse {
    return {
      version: version.toString(),
      variables: variables.map(({ variable, enUsoPublicado }) =>
        VariableTaxonomiaDtoResponse.crear(variable, enUsoPublicado),
      ),
    };
  }
}

/** POST/PATCH: la variable resultante y la versión vigente tras la escritura. */
export class EscrituraVariableTaxonomiaDtoResponse {
  version!: string;
  variable!: VariableTaxonomiaDtoResponse;

  static crear(
    version: VersionTaxonomia,
    variable: VariableTaxonomia,
  ): EscrituraVariableTaxonomiaDtoResponse {
    return {
      version: version.toString(),
      variable: VariableTaxonomiaDtoResponse.crear(variable),
    };
  }
}
