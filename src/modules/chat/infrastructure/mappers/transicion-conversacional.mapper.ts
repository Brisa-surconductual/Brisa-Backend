import { Prisma } from '@prisma/client';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacionMapper } from './regla-validacion.mapper';

/** RF-25: cada transición trae su regla propia (`reglas_nodos.id_regla_validacion`). */
export const INCLUIR_REGLA_DE_TRANSICION = {
  reglas_validaciones: true,
} satisfies Prisma.reglas_nodosInclude;

/** Fila de la transición junto con su regla de validación. */
export type TransicionConReglaFila = Prisma.reglas_nodosGetPayload<{
  include: typeof INCLUIR_REGLA_DE_TRANSICION;
}>;

export class TransicionConversacionalMapper {
  static toDomain(fila: TransicionConReglaFila): TransicionConversacional {
    return new TransicionConversacional(
      fila.id_regla,
      fila.id_flujo,
      fila.id_nodo_origen,
      fila.id_nodo_destino,
      fila.orden_evaluacion,
      fila.reglas_validaciones === null
        ? null
        : ReglaValidacionMapper.toDomain(fila.reglas_validaciones),
      fila.fecha_creacion,
    );
  }

  static toCreateData(
    transicion: TransicionConversacional,
  ): Prisma.reglas_nodosUncheckedCreateInput {
    return {
      id_regla: transicion.idTransicion,
      id_flujo: transicion.idFlujo,
      id_nodo_origen: transicion.idNodoOrigen,
      id_nodo_destino: transicion.idNodoDestino,
      orden_evaluacion: transicion.ordenEvaluacion,
      id_regla_validacion:
        transicion.reglaValidacion?.idReglaValidacion ?? null,
      fecha_creacion: transicion.fechaCreacion,
    };
  }

  static toUpdateData(
    transicion: TransicionConversacional,
  ): Prisma.reglas_nodosUncheckedUpdateInput {
    return {
      id_nodo_destino: transicion.idNodoDestino,
      orden_evaluacion: transicion.ordenEvaluacion,
      id_regla_validacion:
        transicion.reglaValidacion?.idReglaValidacion ?? null,
    };
  }
}
