import type {
  auditoria_arboles,
  tipo_entrada,
  tipo_nodo,
} from '@prisma/client';
import { AuditoriaArbolConversacional } from '../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import { TipoEntradaConversacional } from '../../domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';

export class CatalogosConversacionalesMapper {
  static tipoNodoToDomain(fila: tipo_nodo): TipoNodoConversacional {
    return new TipoNodoConversacional(fila.id_tipo_nodo, fila.nombre);
  }

  static tipoEntradaToDomain(fila: tipo_entrada): TipoEntradaConversacional {
    return new TipoEntradaConversacional(fila.id_tipo_entrada, fila.nombre);
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
