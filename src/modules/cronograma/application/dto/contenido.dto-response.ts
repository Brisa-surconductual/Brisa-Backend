import { Contenido } from '../../domain/entities/contenido.entity';

export class ContenidoDtoResponse {
  id_contenido!: string;
  nombre_contenido!: string;
  tipo_contenido!: string;
  fecha_creacion!: Date;
  fecha_actualizacion!: Date;
  mensaje!: string;

  static crear(contenido: Contenido, mensaje: string): ContenidoDtoResponse {
    const dto = new ContenidoDtoResponse();
    dto.id_contenido = contenido.id_contenido;
    dto.nombre_contenido = contenido.nombre_contenido;
    dto.tipo_contenido = contenido.tipo_contenido;
    dto.fecha_creacion = contenido.fecha_creacion;
    dto.fecha_actualizacion = contenido.fecha_actualizacion;
    dto.mensaje = mensaje;
    return dto;
  }
}
