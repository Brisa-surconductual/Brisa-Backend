import { SesionNoReanudableException } from '../../exceptions/sesion.exceptions';
import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../enums/perfil-clinico.enum';

export type EstadoSesionConversacional =
  'ACTIVA' | 'PAUSADA' | 'COMPLETADA' | 'ERROR_CONFIGURACION';

export interface DatosInicioSesionConversacional {
  idSesion: string;
  idUsuario: string;
  idFlujoConversacional: string;
  versionArbolUtilizada: number;
  modalidadActiva: ModalidadConversacional;
  tipoDependencia: TipoDependenciaClinica | null;
  tipoCraving: TipoCravingClinico | null;
  idNodoInicial: string;
}

/** Datos de una sesión que no pudo asociarse a ningún árbol (RF-26B). */
export interface DatosErrorConfiguracionSesion {
  idSesion: string;
  idUsuario: string;
  modalidadActiva: ModalidadConversacional;
  tipoDependencia: TipoDependenciaClinica | null;
  tipoCraving: TipoCravingClinico | null;
}

export class SesionConversacional {
  constructor(
    readonly idSesion: string,
    readonly idUsuario: string,
    readonly idFlujoConversacional: string | null,
    readonly versionArbolUtilizada: number | null,
    readonly modalidadActiva: ModalidadConversacional,
    readonly tipoDependencia: TipoDependenciaClinica | null,
    readonly tipoCraving: TipoCravingClinico | null,
    readonly idNodoActual: string | null,
    readonly estadoActual: EstadoSesionConversacional,
    readonly fechaInicio: Date,
    readonly fechaUltimaInteraccion: Date,
  ) {}

  static iniciar(
    datos: DatosInicioSesionConversacional,
    ahora: Date,
  ): SesionConversacional {
    return new SesionConversacional(
      datos.idSesion,
      datos.idUsuario,
      datos.idFlujoConversacional,
      datos.versionArbolUtilizada,
      datos.modalidadActiva,
      datos.tipoDependencia,
      datos.tipoCraving,
      datos.idNodoInicial,
      'ACTIVA',
      ahora,
      ahora,
    );
  }

  /**
   * Sesión en ERROR_CONFIGURACION: no hay árbol publicado para el contexto del
   * usuario, así que no registra flujo, versión ni nodo (RF-26B).
   */
  static registrarErrorConfiguracion(
    datos: DatosErrorConfiguracionSesion,
    ahora: Date,
  ): SesionConversacional {
    return new SesionConversacional(
      datos.idSesion,
      datos.idUsuario,
      null,
      null,
      datos.modalidadActiva,
      datos.tipoDependencia,
      datos.tipoCraving,
      null,
      'ERROR_CONFIGURACION',
      ahora,
      ahora,
    );
  }

  get tieneErrorConfiguracion(): boolean {
    return this.estadoActual === 'ERROR_CONFIGURACION';
  }

  esReanudable(): boolean {
    return this.estadoActual === 'ACTIVA' || this.estadoActual === 'PAUSADA';
  }

  reanudar(): SesionConversacional {
    if (!this.esReanudable()) {
      throw new SesionNoReanudableException();
    }

    if (this.estadoActual === 'ACTIVA') {
      return this;
    }

    return this.conEstado('ACTIVA');
  }

  private conEstado(estado: EstadoSesionConversacional): SesionConversacional {
    return new SesionConversacional(
      this.idSesion,
      this.idUsuario,
      this.idFlujoConversacional,
      this.versionArbolUtilizada,
      this.modalidadActiva,
      this.tipoDependencia,
      this.tipoCraving,
      this.idNodoActual,
      estado,
      this.fechaInicio,
      this.fechaUltimaInteraccion,
    );
  }
}
