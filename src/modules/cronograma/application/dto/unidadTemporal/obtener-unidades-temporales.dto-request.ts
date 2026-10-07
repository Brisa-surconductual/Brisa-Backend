import { IsString } from 'class-validator';

export class ObtenerUnidadesTemporalesDtoRequest{
  @IsString()
  idCronograma!: string;
}