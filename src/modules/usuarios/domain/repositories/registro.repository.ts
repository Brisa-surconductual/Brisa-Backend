import { LineaBase, LineaBaseDatos } from '../entities/linea-bases.entity';
import { EstadoRegistro } from '../enums/estado-registro.enum';

export interface ConsentimientoVigente {
  id: string;
  version: string;
  titulo: string;
  urlContenido: string;
}

export interface RevisionRegistro {
  idUsuario: string;
  correoElectronico: string;
  estadoRegistro: EstadoRegistro;
  consentimientoVigente: boolean;
  versionConsentimiento: string | null;
  lineaBase: LineaBase;
}

export abstract class RegistroRepository {
  abstract obtenerConsentimientoVigente(): Promise<ConsentimientoVigente | null>;

  abstract completarConsentimientoYLineaBase(
    idUsuario: string,
    idConsentimiento: string,
    lineaBase: LineaBase,
  ): Promise<void>;

  abstract obtenerRevision(idUsuario: string): Promise<RevisionRegistro | null>;

  abstract actualizarLineaBase(
    idUsuario: string,
    datos: LineaBaseDatos,
    camposModificados: string[],
    invalidaConsentimiento: boolean,
  ): Promise<void>;

  abstract reaceptarConsentimiento(
    idUsuario: string,
    idConsentimiento: string,
  ): Promise<void>;

  abstract confirmarRegistro(idUsuario: string): Promise<void>;

  abstract cancelarRegistroProvisional(idUsuario: string): Promise<boolean>;
}
