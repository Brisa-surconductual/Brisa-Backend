import { EstadoRegistro } from '../../../usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';

export class CondicionesInicializacionUsuario {
  constructor(
    readonly idUsuario: string,
    readonly rol: Rol,
    readonly estadoRegistro: EstadoRegistro,
    readonly consentimientoAceptado: boolean | null,
    readonly idConsentimiento: string | null,
    readonly lineaBaseCapturada: boolean,
  ) {}

  tieneDatosConsistentes(): boolean {
    return !this.consentimientoAceptado || this.idConsentimiento !== null;
  }

  cumpleCondicionesDeInicio(): boolean {
    return (
      this.rol === Rol.ESTUDIANTE &&
      this.estadoRegistro === EstadoRegistro.REGISTRO_COMPLETO &&
      this.consentimientoAceptado === true &&
      this.lineaBaseCapturada
    );
  }
}
