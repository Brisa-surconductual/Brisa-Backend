import { Allow, Equals, IsInt, IsISO8601, IsUUID, Matches, Min } from 'class-validator';

export class ProcesarRespuestaDtoRequest {
  @IsUUID()
  idRespuesta!: string;

  @IsUUID()
  idNodo!: string;

  // El dominio comprueba el tipo del nodo, también cuando el campo falta.
  @Allow()
  tipoEntrada!: string;

  @Allow()
  valor!: unknown;

  // RF-30: la asigna el dispositivo; define el orden real, no el reloj local.
  @IsInt()
  @Min(1)
  secuencia!: number;

  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/u)
  capturadaEn!: string;

  @Equals('EN_LINEA')
  conectividad!: string;
}
