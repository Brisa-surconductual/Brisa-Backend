import { IsString } from 'class-validator';

export class ActualizarDisponibilidadContenidoDtoResponse {
  
  @IsString()
  mensaje!: string;

  static fromMensaje(): ActualizarDisponibilidadContenidoDtoResponse {
    const response = new ActualizarDisponibilidadContenidoDtoResponse();
    response.mensaje = "Disponibilidad del contenido actualizada correctamente.";
    return response;
  }

}