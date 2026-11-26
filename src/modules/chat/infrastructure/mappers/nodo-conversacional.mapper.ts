import { Prisma } from '@prisma/client';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { ExtrasNodo, SIN_EXTRAS } from '../persistence/consultas-nodo-extra';

/** Fila de nodos junto con el nombre de su tipo. */
export type NodoConTipoFila = Prisma.nodosGetPayload<{
  include: { tipo_nodo: { select: { nombre: true } } };
}>;

export class NodoConversacionalMapper {
  /**
   * `es_nodo_final` e `id_contenido` llegan aparte: el cliente tipado aún no
   * conoce esas columnas (se leen con SQL hasta regenerar schema.prisma).
   */
  static toDomain(
    fila: NodoConTipoFila,
    extras: ExtrasNodo = SIN_EXTRAS,
  ): NodoConversacional {
    return new NodoConversacional(
      fila.id_nodo,
      fila.id_flujo,
      fila.id_tipo_nodo,
      fila.tipo_nodo.nombre,
      fila.contenido as Record<string, unknown>,
      fila.es_nodo_inicial,
      fila.orden,
      extras.idContenido,
      fila.creado_por,
      fila.fecha_creacion,
      fila.fecha_actualizacion,
      extras.esNodoFinal,
    );
  }

  static toCreateData(
    nodo: NodoConversacional,
  ): Prisma.nodosUncheckedCreateInput {
    return {
      id_nodo: nodo.idNodo,
      id_flujo: nodo.idFlujo,
      id_tipo_nodo: nodo.idTipoNodo,
      contenido: nodo.contenido as Prisma.InputJsonValue,
      es_nodo_inicial: nodo.esNodoInicial,
      orden: nodo.orden,
      // OBSOLETO (RF-24): el contenido viaja en `id_contenido` (SQL aparte).
      id_contenido_cronograma: null,
      creado_por: nodo.creadoPor,
      fecha_creacion: nodo.fechaCreacion,
      fecha_actualizacion: nodo.fechaActualizacion,
    };
  }

  static toUpdateData(
    nodo: NodoConversacional,
  ): Prisma.nodosUncheckedUpdateInput {
    return {
      id_tipo_nodo: nodo.idTipoNodo,
      contenido: nodo.contenido as Prisma.InputJsonValue,
      es_nodo_inicial: nodo.esNodoInicial,
      orden: nodo.orden,
      fecha_actualizacion: nodo.fechaActualizacion,
    };
  }
}
