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
    readonly idPrograma: number,
    readonly modalidad: ModalidadConversacional,
    readonly fechaVigenciaDesde: Date,
    readonly fechaVigenciaHasta: Date | null = null,
    readonly administradorResponsable: string | null = null,
  ) {}

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
      this.idPrograma,
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
        this.idPrograma,
        ModalidadConversacional.PERSONALIZADA,
        fecha,
        null,
        idAdministrador,
      ),
    };
  }
}
