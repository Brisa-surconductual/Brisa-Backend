export class RegistrarActividadSesionDtoResponse {
  activa!: boolean;
  estadoAplicacion!: string;
  fechaUltimaInteraccion!: Date;
  mensaje!: string;

  static crear(
    estadoAplicacion: string,
    fechaUltimaInteraccion: Date,
  ): RegistrarActividadSesionDtoResponse {
    const dto = new RegistrarActividadSesionDtoResponse();
    dto.activa = true;
    dto.estadoAplicacion = estadoAplicacion;
    dto.fechaUltimaInteraccion = fechaUltimaInteraccion;
    dto.mensaje = 'La actividad de la sesión fue actualizada correctamente.';
    return dto;
  }
}
