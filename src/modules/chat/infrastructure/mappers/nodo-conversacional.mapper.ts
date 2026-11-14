import { Prisma } from '@prisma/client';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';

/** Fila de nodos junto con el nombre de su tipo. */
export type NodoConTipoFila = Prisma.nodosGetPayload<{
  include: { tipo_nodo: { select: { nombre: true } } };
}>;

export class NodoConversacionalMapper {
  static toDomain(fila: NodoConTipoFila): NodoConversacional {
    return new NodoConversacional(
      fila.id_nodo,
      fila.id_flujo,
      fila.id_tipo_nodo,
      fila.tipo_nodo.nombre,
      fila.contenido as Record<string, unknown>,
      fila.es_nodo_inicial,
      fila.orden,
      fila.id_contenido_cronograma,
      fila.creado_por,
      fila.fecha_creacion,
      fila.fecha_actualizacion,
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
      id_contenido_cronograma: nodo.idContenidoCronograma,
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
      id_contenido_cronograma: nodo.idContenidoCronograma,
      fecha_actualizacion: nodo.fechaActualizacion,
    };
  }
}
