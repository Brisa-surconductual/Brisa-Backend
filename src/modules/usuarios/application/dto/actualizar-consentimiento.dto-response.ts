import { IsString, Matches } from 'class-validator';

export class ActualizacionConsentimientoDtoResponse {

  @IsString()
  mensaje!: string;

  static crearRespuesta(): ActualizacionConsentimientoDtoResponse {
    const respuesta = new ActualizacionConsentimientoDtoResponse();
    respuesta.mensaje = 'Consentimiento actualizado correctamente';
    return respuesta;
  }
}
