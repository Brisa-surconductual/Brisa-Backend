import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

export class SesionActualDtoResponse {
  idUsuario!: string;
  alcance!: AlcanceSesion;
  estadoRegistro!: string;
  rol!: string;
  csrfToken!: string;
  limiteInactividadMinutos!: number;

  static crear(datos: SesionActualDtoResponse): SesionActualDtoResponse {
    return Object.assign(new SesionActualDtoResponse(), datos);
  }
}
