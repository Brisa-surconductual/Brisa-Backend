import type {
  auditoria_arboles,
  Prisma,
  tipo_entrada,
  tipo_nodo,
} from '@prisma/client';
import { AuditoriaArbolConversacional } from '../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import { ContenidoCronogramaConversacional } from '../../domain/entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../../domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';

/** Fila de `contenidos_cronograma` con el nombre del contenido y de su unidad temporal. */
export type ContenidoCronogramaFila = Prisma.contenidos_cronogramaGetPayload<{
  include: {
    contenidos: { select: { nombre_contenido: true } };
    unidades_temporales: {
      select: { nombre_unidad: true; orden_unidad: true };
    };
  };
}>;

export class CatalogosConversacionalesMapper {
  static tipoNodoToDomain(fila: tipo_nodo): TipoNodoConversacional {
    return new TipoNodoConversacional(fila.id_tipo_nodo, fila.nombre);
  }

  static tipoEntradaToDomain(fila: tipo_entrada): TipoEntradaConversacional {
    return new TipoEntradaConversacional(fila.id_tipo_entrada, fila.nombre);
  }

  static contenidoCronogramaToDomain(
    fila: ContenidoCronogramaFila,
  ): ContenidoCronogramaConversacional {
    return new ContenidoCronogramaConversacional(
      fila.id_contenido_cronograma,
      fila.id_contenido,
      fila.contenidos.nombre_contenido,
      fila.id_unidad_temporal,
      fila.unidades_temporales.nombre_unidad,
      fila.unidades_temporales.orden_unidad,
    );
  }

  static auditoriaToDomain(
    fila: auditoria_arboles,
    idFlujo: string,
  ): AuditoriaArbolConversacional {
    return new AuditoriaArbolConversacional(
      BigInt(fila.id_auditoria),
      idFlujo,
      fila.id_actor,
      fila.accion,
      fila.id_objeto,
      fila.fecha_operacion,
    );
  }
}
