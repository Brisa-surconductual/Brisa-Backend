import { IsString } from 'class-validator';

export class CrearCronogramaDtoResponse {
  @IsString()
  mensaje: string;
  static crearMensaje(): CrearCronogramaDtoResponse {
    const response = new CrearCronogramaDtoResponse();
    response.mensaje = `El cronograma ha sido creado exitosamente.`;
    return response;
  }
}
