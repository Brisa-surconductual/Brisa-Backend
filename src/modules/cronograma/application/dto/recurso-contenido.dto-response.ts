import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';

export class RecursoContenidoDtoResponse {
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
  mensaje!: string;

  static crear(
    recurso: RecursoContenido,
    idModulos: string[],
  ): RecursoContenidoDtoResponse {
    const dto = new RecursoContenidoDtoResponse();
    dto.id_recurso = recurso.id_recurso;
    dto.id_contenido = recurso.id_contenido;
    dto.tipo_recurso = recurso.tipo_recurso;
    dto.orden_bloque = recurso.orden_bloque;
    dto.texto_contenido = recurso.texto_contenido;
    dto.clave_almacenamiento = recurso.clave_almacenamiento;
    dto.mime_type = recurso.mime_type;
    dto.tamano_bytes =
      recurso.tamano_bytes === null ? null : Number(recurso.tamano_bytes);
    dto.duracion_segundos = recurso.duracion_segundos;
    dto.texto_alternativo = recurso.texto_alternativo;
    dto.id_modulos = idModulos;
    dto.fecha_creacion = recurso.fecha_creacion;
    dto.mensaje = 'Recurso creado y asociado a sus módulos correctamente.';
    return dto;
  }
}
