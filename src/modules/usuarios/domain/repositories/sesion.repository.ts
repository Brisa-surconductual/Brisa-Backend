import { EstadoAplicacion } from '../enums/estado-aplicacion-enum';
import { MotivoCierre } from '../enums/motivo-cierre-enum';

export interface SesionPersistida {
  id: string;
  idUsuario: string;
  fechaInicio: Date;
  fechaUltimaInteraccion: Date;
  limiteInactividadMinutos: number;
  estadoAplicacion: EstadoAplicacion;
  activa: boolean;
}

export abstract class SesionRepository {
  abstract crearSesion(
    idUsuario: string,
    limiteInactividadMinutos: number,
  ): Promise<SesionPersistida>;

  abstract buscarSesionPorId(
    idSesion: string,
  ): Promise<SesionPersistida | null>;

  abstract registrarInteraccion(idSesion: string, fecha: Date): Promise<void>;

  abstract actualizarEstadoAplicacion(
    idSesion: string,
    estado: EstadoAplicacion,
    fecha: Date,
  ): Promise<void>;

  abstract cerrar(
    idSesion: string,
    motivo: MotivoCierre,
    fecha: Date,
  ): Promise<boolean>;

  abstract cerrarTodasDelUsuario(
    idUsuario: string,
    motivo: MotivoCierre,
    fecha: Date,
  ): Promise<void>;
}
