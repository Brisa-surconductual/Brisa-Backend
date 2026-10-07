import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

export type SiguienteAccionSesion =
  'COMPLETAR_CONSENTIMIENTO' | 'REVISAR_REGISTRO' | 'INGRESAR';

export class IniciarSesionDtoResponse {
  idUsuario!: string;
  alcance!: AlcanceSesion;
  estadoRegistro!: string;
  rol!: string;
  siguienteAccion!: SiguienteAccionSesion;
  limiteInactividadMinutos!: number;
  csrfToken!: string;
  mensaje!: string;

  static crear(datos: IniciarSesionDtoResponse): IniciarSesionDtoResponse {
    return Object.assign(new IniciarSesionDtoResponse(), datos);
  }
}
