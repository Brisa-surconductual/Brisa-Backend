export class AsignarCronogramaDtoResponse {
  constructor(
    public readonly id_usuario: string,
    public readonly id_cronograma_asignado: string,
    public readonly fecha_inicio_efectiva: Date,
    public readonly mensaje: string,
  ) {}

  static crear(
    idUsuario: string,
    idCronograma: string,
    fecha: Date,
    interrumpido: boolean,
  ): AsignarCronogramaDtoResponse {
    const msj = interrumpido
      ? 'Cronograma interrumpido y reasignado exitosamente.'
      : 'Nuevo cronograma programado para iniciar al finalizar el actual.';
    return new AsignarCronogramaDtoResponse(
      idUsuario,
      idCronograma,
      fecha,
      msj,
    );
  }
}
