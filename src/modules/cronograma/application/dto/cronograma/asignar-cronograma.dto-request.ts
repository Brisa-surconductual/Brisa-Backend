import { IsBoolean, IsUUID } from 'class-validator';

export class AsignarCronogramaDtoRequest {
  @IsUUID()
  id_cronograma_nuevo!: string;

  @IsBoolean()
  interrumpir!: boolean;
}
