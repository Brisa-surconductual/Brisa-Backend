import { Contenido } from '../../domain/entities/contenido.entity';

export class ContenidoDtoResponse {
  id_contenido!: string;
  mensaje!: string;

  static crear(contenido: Contenido, mensaje: string): ContenidoDtoResponse {
    const dto = new ContenidoDtoResponse();
    dto.id_contenido = contenido.id_contenido;
    dto.mensaje = mensaje;
    return dto;
  }
}
