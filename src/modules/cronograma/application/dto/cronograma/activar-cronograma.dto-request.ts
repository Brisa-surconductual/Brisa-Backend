import { Equals, IsBoolean } from 'class-validator';

export class ActivarCronogramaDtoRequest {
  @IsBoolean()
  @Equals(true)
  confirmacion_activacion!: boolean;
}
