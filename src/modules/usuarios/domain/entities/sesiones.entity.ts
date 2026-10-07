import { randomUUID } from 'crypto';
import { MotivoCierre } from '../enums/motivo-cierre-enum';
import { EstadoAplicacion } from '../enums/estado-aplicacion-enum';
import { AlcanceSesion } from '../enums/alcance-sesion.enum';

export class Sesion {
  constructor(
    readonly id_sesion: string,
    readonly id_usuario: string,
    readonly token_hash: string | null,
    readonly csrf_token_hash: string | null,
    readonly alcance_sesion: AlcanceSesion,
    readonly fecha_inicio_sesion: Date,
    readonly fecha_ultima_interaccion: Date,
    readonly limite_inactividad_minutos: number,
    readonly estado_aplicacion: EstadoAplicacion,
    readonly activa: boolean,
    readonly fecha_cierre_sesion: Date | null,
    readonly motivo_cierre_sesion: MotivoCierre | null,
  ) {}

  static iniciar(
    idUsuario: string,
    tokenHash: string,
    csrfTokenHash: string,
    alcanceSesion: AlcanceSesion,
    limiteInactividadMinutos: number,
    ahora: Date = new Date(),
  ): Sesion {
    return new Sesion(
      randomUUID(),
      idUsuario,
      tokenHash,
      csrfTokenHash,
      alcanceSesion,
      ahora,
      ahora,
      limiteInactividadMinutos,
      EstadoAplicacion.ACTIVA,
      true,
      null,
      null,
    );
  }

  obtenerMotivoExpiracion(
    ahora: Date,
    limiteSegundoPlanoMinutos: number,
  ): MotivoCierre | null {
    const minutosTranscurridos =
      (ahora.getTime() - this.fecha_ultima_interaccion.getTime()) / 60_000;

    if (
      this.estado_aplicacion === EstadoAplicacion.SEGUNDO_PLANO &&
      minutosTranscurridos >= limiteSegundoPlanoMinutos
    ) {
      return MotivoCierre.SEGUNDO_PLANO;
    }

    if (
      this.estado_aplicacion === EstadoAplicacion.ACTIVA &&
      minutosTranscurridos >= this.limite_inactividad_minutos
    ) {
      return MotivoCierre.INACTIVIDAD;
    }

    return null;
  }
}
