import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/arbol-conversacional.enums';

export type EstadoSesionConversacional = 'ACTIVA' | 'PAUSADA' | 'COMPLETADA';

export interface SesionConversacional {
  idSesion: string;
  idUsuario: string;
  idFlujoConversacional: string;
  versionArbolUtilizada: number;
  modalidadActiva: ModalidadConversacional;
  tipoDependencia: TipoDependenciaClinica | null;
  tipoCraving: TipoCravingClinico | null;
  idNodoActual: string;
  estadoActual: EstadoSesionConversacional;
  fechaInicio: Date;
  fechaUltimaInteraccion: Date;
}

export interface DatosNuevaSesionConversacional {
  idUsuario: string;
  idFlujoConversacional: string;
  versionArbolUtilizada: number;
  modalidadActiva: ModalidadConversacional;
  tipoDependencia: TipoDependenciaClinica | null;
  tipoCraving: TipoCravingClinico | null;
  idNodoInicial: string;
}

export interface ResultadoInicioSesionConversacional {
  sesion: SesionConversacional;
  reanudada: boolean;
}

export abstract class SesionConversacionalRepository {
  abstract buscarUltimaReanudable(
    idUsuario: string,
  ): Promise<SesionConversacional | null>;

  abstract iniciarOReanudar(
    datos: DatosNuevaSesionConversacional,
  ): Promise<ResultadoInicioSesionConversacional>;
}
