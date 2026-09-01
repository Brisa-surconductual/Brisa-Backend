import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';

export class RecursoContenidoDtoResponse {
  id_recurso!: string;
  mensaje!: string;

  static crear(recurso: RecursoContenido): RecursoContenidoDtoResponse {
    const dto = new RecursoContenidoDtoResponse();
    dto.id_recurso = recurso.id_recurso;
    dto.mensaje = 'Recurso creado y asociado a sus módulos correctamente.';
    return dto;
  }
}
