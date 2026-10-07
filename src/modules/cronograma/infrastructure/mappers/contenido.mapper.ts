import { tipo_contenido_enum } from '@prisma/client';
import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';

export class ContenidoMapper {
  static toDomain(contenido: {
    id_contenido: string;
    nombre_contenido: string;
    tipo_contenido: tipo_contenido_enum;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
  }): Contenido {
    return new Contenido(
      contenido.id_contenido,
      contenido.nombre_contenido,
      contenido.tipo_contenido as TipoContenido,
      contenido.fecha_creacion,
      contenido.fecha_actualizacion,
    );
  }

  static toPrisma(contenido: Contenido) {
    return {
      id_contenido: contenido.id_contenido,
      nombre_contenido: contenido.nombre_contenido,
      tipo_contenido: contenido.tipo_contenido as tipo_contenido_enum,
      fecha_creacion: contenido.fecha_creacion,
      fecha_actualizacion: contenido.fecha_actualizacion,
    };
  }
}
