import { IsString} from 'class-validator';

export class ActualizacionConsentimientoDtoRequest {

  @IsString()
  idConsentimeinto!: string;

  @IsString()
  idUsuario!: string;
}
