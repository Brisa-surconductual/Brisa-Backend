import { EstadoCodigo } from '../enums/estado-codigo-enum';

export interface SolicitudRecuperacionPersistida {
  id: string;
  idUsuario: string | null;
  codigoHash: string | null;
  fechaExpiracion: Date | null;
  estado: EstadoCodigo | null;
}

export interface NuevaSolicitudRecuperacion {
  correoElectronico: string;
  direccionIp: string;
  idUsuario: string | null;
  codigoHash: string | null;
  fechaExpiracion: Date | null;
  estado: EstadoCodigo;
}

export abstract class RecuperacionContrasenaRepository {
  abstract contarSolicitudesDesde(
    correoElectronico: string,
    direccionIp: string,
    desde: Date,
  ): Promise<number>;

  abstract registrar(solicitud: NuevaSolicitudRecuperacion): Promise<void>;

  abstract buscarPorCodigoHash(
    codigoHash: string,
  ): Promise<SolicitudRecuperacionPersistida | null>;

  abstract marcarExpirada(idSolicitud: string): Promise<void>;

  abstract actualizarContrasenaYConsumirCodigo(
    idSolicitud: string,
    idUsuario: string,
    contrasenaHash: string,
  ): Promise<void>;
}
