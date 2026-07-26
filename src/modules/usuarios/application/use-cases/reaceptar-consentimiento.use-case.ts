import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import {
  ConsentimientoNoDisponibleException,
  ConsentimientoRequeridoException,
  EstadoRegistroInvalidoException,
} from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export interface ReaceptarConsentimientoInput {
  idConsentimiento: string;
  consentimientoAceptado: boolean;
  registroConsumoAutorizado: boolean;
}

export class ReaceptarConsentimientoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly registroRepository: RegistroRepository,
  ) {}

  async execute(idUsuario: string, input: ReaceptarConsentimientoInput) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    const revision = await this.registroRepository.obtenerRevision(idUsuario);

    if (
      !usuario ||
      !revision ||
      usuario.getEstadoRegistro() !== EstadoRegistro.PENDIENTE_CONSENTIMIENTO
    ) {
      throw new EstadoRegistroInvalidoException();
    }

    if (!input.consentimientoAceptado || !input.registroConsumoAutorizado) {
      throw new ConsentimientoRequeridoException();
    }

    const consentimiento =
      await this.registroRepository.obtenerConsentimientoVigente();
    if (!consentimiento || consentimiento.id !== input.idConsentimiento) {
      throw new ConsentimientoNoDisponibleException();
    }

    await this.registroRepository.reaceptarConsentimiento(
      idUsuario,
      consentimiento.id,
    );

    return {
      estadoRegistro: EstadoRegistro.PENDIENTE_REVISION,
      siguientePaso: obtenerSiguientePaso(EstadoRegistro.PENDIENTE_REVISION),
      mensaje: 'Consentimiento aceptado nuevamente.',
    };
  }
}
