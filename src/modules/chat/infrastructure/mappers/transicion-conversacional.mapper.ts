import { Prisma } from '@prisma/client';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import { ReglaValidacionMapper } from './regla-validacion.mapper';

/**
 * La regla de validación vive en el nodo origen (`nodos.id_regla_validacion`);
 * la transición la obtiene a través de él.
 */
export const INCLUIR_REGLA_DE_NODO_ORIGEN = {
  nodos_reglas_nodos_id_nodo_origen_id_flujoTonodos: {
    include: { reglas_validaciones: true },
  },
} satisfies Prisma.reglas_nodosInclude;

/** Fila de la transición junto con su regla de validación. */
export type TransicionConReglaFila = Prisma.reglas_nodosGetPayload<{
  include: typeof INCLUIR_REGLA_DE_NODO_ORIGEN;
}>;

export class TransicionConversacionalMapper {
  static toDomain(fila: TransicionConReglaFila): TransicionConversacional {
    const regla =
      fila.nodos_reglas_nodos_id_nodo_origen_id_flujoTonodos
        .reglas_validaciones;
    if (regla === null) {
      throw new Error(
        `El nodo origen de la transición ${fila.id_regla} no tiene regla de validación`,
      );
    }
    return new TransicionConversacional(
      fila.id_regla,
      fila.id_flujo,
      fila.id_nodo_origen,
      fila.id_nodo_destino,
      fila.operador_condicion as OperadorCondicion,
      fila.valor_condicion,
      fila.orden_evaluacion,
      ReglaValidacionMapper.toDomain(regla),
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
      operador_condicion: transicion.operadorCondicion,
      valor_condicion: TransicionConversacionalMapper.valorCondicion(
        transicion.valorCondicion,
      ),
      orden_evaluacion: transicion.ordenEvaluacion,
      fecha_creacion: transicion.fechaCreacion,
    };
  }

  static toUpdateData(
    transicion: TransicionConversacional,
  ): Prisma.reglas_nodosUncheckedUpdateInput {
    return {
      id_nodo_origen: transicion.idNodoOrigen,
      id_nodo_destino: transicion.idNodoDestino,
      operador_condicion: transicion.operadorCondicion,
      valor_condicion: TransicionConversacionalMapper.valorCondicion(
        transicion.valorCondicion,
      ),
      orden_evaluacion: transicion.ordenEvaluacion,
    };
  }

  private static valorCondicion(valor: unknown): Prisma.InputJsonValue {
    return valor === null
      ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue)
      : (valor as Prisma.InputJsonValue);
  }
}
