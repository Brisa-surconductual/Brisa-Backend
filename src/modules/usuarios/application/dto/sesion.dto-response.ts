import { Sesion } from "../../domain/entities/sesiones.entity";

export class SesionDtoResponse {
  sesion!: Sesion;
  tokenSesion!: string;
  csrfToken!: string;
}