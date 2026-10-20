import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { ModalidadConversacional } from '../enums/arbol-conversacional.enums';

export interface AsignacionModalidadVigente {
  readonly idUsuario: string;
  readonly modalidad: ModalidadConversacional;
  readonly rol: Rol;
  readonly estadoCuenta: EstadoCuenta;
  readonly perfilCompleto: boolean;
}

export abstract class ModalidadProgramaRepository {
  abstract listarAsignacionesVigentesPorPrograma(
    idPrograma: number,
  ): Promise<AsignacionModalidadVigente[]>;
}
