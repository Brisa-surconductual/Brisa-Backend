import { Prisma } from '@prisma/client';
import type { reglas_validaciones } from '@prisma/client';
import { ReglaValidacion } from '../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';

export class ReglaValidacionMapper {
  static toDomain(fila: reglas_validaciones): ReglaValidacion {
    return new ReglaValidacion(
      fila.id_regla_validacion,
      fila.tipo_dato as TipoDatoValidacion,
      fila.obligatorio,
      fila.valor_min === null ? null : fila.valor_min.toNumber(),
      fila.valor_max === null ? null : fila.valor_max.toNumber(),
      fila.formato_regex,
      fila.valores_permitidos ?? [],
      fila.mensaje_error,
    );
  }

  static toData(regla: ReglaValidacion): Prisma.reglas_validacionesCreateInput {
    return {
      id_regla_validacion: regla.idReglaValidacion,
      tipo_dato: regla.tipoDato,
      obligatorio: regla.obligatorio,
      valor_min: regla.valorMin,
      valor_max: regla.valorMax,
      formato_regex: regla.formatoRegex,
      valores_permitidos: regla.valoresPermitidos,
      mensaje_error: regla.mensajeError,
    };
  }
}
