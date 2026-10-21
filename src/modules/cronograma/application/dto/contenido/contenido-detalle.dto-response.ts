import { IsArray, IsString } from 'class-validator';

export class ContenidoDetalleResponseDto {
  idContenidoCronograma!: string;
  ordenContenido!: number | null;
  fechaInicioDisponibilidad!: Date | null;
  fechaFinDisponibilidad!: Date | null;
  @IsString()
  idContenido!: string;

  @IsString()
  nombreContenido!: string;

  @IsString()
  tipo!: string;

  @IsString()
  @IsArray()
  recursos!: { idRecurso: string; claveAlmacenamiento: string }[];
}
