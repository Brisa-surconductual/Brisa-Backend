import { RecursoContenidoDetalle } from '../../../domain/repositories/recurso-contenido.repository';

export class RecursoDetalleDtoResponse {
  id_recurso!: string;
  id_contenido!: string;
  tipo_recurso!: string;
  orden_bloque!: number;
  texto_contenido!: string | null;
  clave_almacenamiento!: string | null;
  mime_type!: string | null;
  tamano_bytes!: number | null;
  duracion_segundos!: number | null;
  texto_alternativo!: string | null;
  id_modulos!: string[];
  fecha_creacion!: Date;

  static crear(detalle: RecursoContenidoDetalle): RecursoDetalleDtoResponse {
    const { recurso, idModulos } = detalle;
    return {
      id_recurso: recurso.id_recurso,
      id_contenido: recurso.id_contenido,
      tipo_recurso: recurso.tipo_recurso,
      orden_bloque: recurso.orden_bloque,
      texto_contenido: recurso.texto_contenido,
      clave_almacenamiento: recurso.clave_almacenamiento,
      mime_type: recurso.mime_type,
      tamano_bytes:
        recurso.tamano_bytes === null ? null : Number(recurso.tamano_bytes),
      duracion_segundos: recurso.duracion_segundos,
      texto_alternativo: recurso.texto_alternativo,
      id_modulos: idModulos,
      fecha_creacion: recurso.fecha_creacion,
    };
  }
}
