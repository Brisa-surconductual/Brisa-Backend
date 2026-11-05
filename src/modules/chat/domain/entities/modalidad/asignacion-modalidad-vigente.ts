import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';
import { AsignacionModalidad } from './asignacion-modalidad.entity';

export class AsignacionModalidadVigente {
  constructor(
    readonly asignacion: AsignacionModalidad,
    readonly esEstudiante: boolean,
    readonly cuentaActiva: boolean,
    readonly perfilCompleto: boolean,
  ) {}

  get idUsuario(): string {
    return this.asignacion.idUsuario;
  }

  get modalidad(): ModalidadConversacional {
    return this.asignacion.modalidad;
  }
}
