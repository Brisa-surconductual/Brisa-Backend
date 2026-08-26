import { tipo_recurso_enum } from '@prisma/client';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';

export class RecursoContenidoMapper {
  static toDomain(recurso: {
    id_recurso: string;
    id_contenido: string;
    tipo_recurso: tipo_recurso_enum;
    orden_bloque: number;
    texto_contenido: string | null;
    clave_almacenamiento: string | null;
    mime_type: string | null;
    tamano_bytes: bigint | null;
    duracion_segundos: number | null;
    texto_alternativo: string | null;
    fecha_creacion: Date;
  }): RecursoContenido {
    return new RecursoContenido(
      recurso.id_recurso,
      recurso.id_contenido,
      recurso.tipo_recurso as TipoRecurso,
      recurso.orden_bloque,
      recurso.texto_contenido,
      recurso.clave_almacenamiento,
      recurso.mime_type,
      recurso.tamano_bytes,
      recurso.duracion_segundos,
      recurso.texto_alternativo,
      recurso.fecha_creacion,
    );
  }

  static toPrisma(recurso: RecursoContenido) {
    return {
      id_recurso: recurso.id_recurso,
      id_contenido: recurso.id_contenido,
      tipo_recurso: recurso.tipo_recurso as tipo_recurso_enum,
      orden_bloque: recurso.orden_bloque,
      texto_contenido: recurso.texto_contenido,
      clave_almacenamiento: recurso.clave_almacenamiento,
      mime_type: recurso.mime_type,
      tamano_bytes: recurso.tamano_bytes,
      duracion_segundos: recurso.duracion_segundos,
      texto_alternativo: recurso.texto_alternativo,
      fecha_creacion: recurso.fecha_creacion,
    };
  }
}
