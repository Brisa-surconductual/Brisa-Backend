import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';
import {
  AsignacionNoVigenteException,
  ModalidadNoGrupalException,
} from '../../exceptions';

export interface TransicionAPersonalizada {
  readonly cerrada: AsignacionModalidad;
  readonly nueva: AsignacionModalidad;
}

export class AsignacionModalidad {
  constructor(
    readonly idAsignacion: string,
    readonly idUsuario: string,
    readonly modalidad: ModalidadConversacional,
    readonly fechaVigenciaDesde: Date,
    readonly fechaVigenciaHasta: Date | null = null,
    readonly administradorResponsable: string | null = null,
  ) {}

  /** Asignación inicial en GRUPAL al registrarse el estudiante (sin administrador responsable). */
  static crearInicialGrupal(
    idAsignacion: string,
    idUsuario: string,
    fecha: Date = new Date(),
  ): AsignacionModalidad {
    return new AsignacionModalidad(
      idAsignacion,
      idUsuario,
      ModalidadConversacional.GRUPAL,
      fecha,
    );
  }

  get vigente(): boolean {
    return this.fechaVigenciaHasta === null;
  }

  cerrar(fecha: Date): AsignacionModalidad {
    if (!this.vigente) {
      throw new AsignacionNoVigenteException();
    }

    return new AsignacionModalidad(
      this.idAsignacion,
      this.idUsuario,
      this.modalidad,
      this.fechaVigenciaDesde,
      fecha,
      this.administradorResponsable,
    );
  }

  habilitarPersonalizada(
    idNuevaAsignacion: string,
    fecha: Date,
    idAdministrador: string,
  ): TransicionAPersonalizada {
    if (this.modalidad !== ModalidadConversacional.GRUPAL) {
      throw new ModalidadNoGrupalException();
    }

    return {
      cerrada: this.cerrar(fecha),
      nueva: new AsignacionModalidad(
        idNuevaAsignacion,
        this.idUsuario,
        ModalidadConversacional.PERSONALIZADA,
        fecha,
        null,
        idAdministrador,
      ),
    };
  }
}
