import { Prisma } from '@prisma/client';
import {
  ReglasEtiqueta,
  VariableTaxonomia,
} from '../../domain/entities/taxonomia/variable-taxonomia.entity';
import { TipoEntradaRespuesta } from '../../domain/enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable } from '../../domain/enums/tipo-valor-variable.enum';

/** Fila de `chat.taxonomia_variables` (las tablas RF-30B se leen con SQL). */
export interface FilaVariableTaxonomia {
  id_variable: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_valor: string;
  valores: string[] | null;
  tipos_entrada_permitidos: string[];
  etiquetas: unknown;
  habilitada: boolean;
}

/** Columnas de una variable; los enums salen como texto. */
export const COLUMNAS_VARIABLE = Prisma.sql`
  v.id_variable::text AS id_variable, v.codigo, v.nombre, v.descripcion,
  v.tipo_valor::text AS tipo_valor, v.valores, v.tipos_entrada_permitidos,
  v.etiquetas, v.habilitada`;

/** Algún nodo de un flujo PUBLICADO captura la variable `v`. */
export const EN_USO_PUBLICADO = Prisma.sql`EXISTS (
  SELECT 1 FROM chat.nodos n
  JOIN chat.flujo_conversacion f ON f.id_flujo = n.id_flujo
  WHERE f.estado = 'PUBLICADO' AND n.contenido -> 'variable' ->> 'codigo' = v.codigo
)`;

export class TaxonomiaVariableMapper {
  static toDomain(fila: FilaVariableTaxonomia): VariableTaxonomia {
    return new VariableTaxonomia(
      fila.id_variable,
      fila.codigo,
      fila.nombre,
      fila.descripcion,
      fila.tipo_valor as TipoValorVariable,
      fila.valores,
      fila.tipos_entrada_permitidos as TipoEntradaRespuesta[],
      fila.etiquetas as ReglasEtiqueta,
      fila.habilitada,
    );
  }
}
