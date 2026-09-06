export class UnidadTemporalDtoResponse {
  mensaje!: string;

  static crear(): UnidadTemporalDtoResponse {
    const dto = new UnidadTemporalDtoResponse();
    dto.mensaje = 'Unidad temporal creada correctamente.';
    return dto;
  }
}
