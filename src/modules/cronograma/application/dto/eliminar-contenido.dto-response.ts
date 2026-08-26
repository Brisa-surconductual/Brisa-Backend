export class EliminarContenidoDtoResponse {
  mensaje!: string;

  static crear(): EliminarContenidoDtoResponse {
    const dto = new EliminarContenidoDtoResponse();
    dto.mensaje = 'Contenido psicoeducativo eliminado correctamente.';
    return dto;
  }
}
