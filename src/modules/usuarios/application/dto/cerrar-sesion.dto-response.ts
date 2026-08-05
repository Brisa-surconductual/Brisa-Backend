export class CerrarSesionDtoResponse {
  mensaje!: string;

  static crear(): CerrarSesionDtoResponse {
    const dto = new CerrarSesionDtoResponse();
    dto.mensaje =
      'La sesión se cerró correctamente. Debe iniciar sesión nuevamente.';
    return dto;
  }
}
