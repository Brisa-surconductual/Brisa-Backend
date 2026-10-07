import { Sesion } from '../entities/sesiones.entity';
import { EstadoAplicacion } from '../enums/estado-aplicacion-enum';
import { MotivoCierre } from '../enums/motivo-cierre-enum';

export abstract class SesionRepository {
  abstract crear(sesion: Sesion): Promise<void>;

  abstract buscarActivaPorTokenHash(tokenHash: string): Promise<Sesion | null>;

  abstract cerrarActiva(
    idSesion: string,
    fechaCierre: Date,
    motivo: MotivoCierre,
  ): Promise<boolean>;

  abstract registrarActividad(
    idSesion: string,
    fechaInteraccion: Date,
    estadoAplicacion: EstadoAplicacion,
  ): Promise<boolean>;

  abstract actualizarCsrfToken(
    idSesion: string,
    csrfTokenHash: string,
  ): Promise<boolean>;

  abstract expirarPorInactividad(
    fechaLimite: Date,
    fechaCierre: Date,
  ): Promise<number>;

  abstract expirarPorSegundoPlano(
    fechaLimite: Date,
    fechaCierre: Date,
  ): Promise<number>;
}
