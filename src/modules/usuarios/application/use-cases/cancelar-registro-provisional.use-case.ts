import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { EstadoRegistroInvalidoException } from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';

export class CancelarRegistroProvisionalUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly registroRepository: RegistroRepository,
  ) {}

  async execute(idUsuario: string) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (
      !usuario ||
      usuario.getEstadoRegistro() !== EstadoRegistro.PENDIENTE_CONSENTIMIENTO
    ) {
      throw new EstadoRegistroInvalidoException();
    }

    const eliminado =
      await this.registroRepository.cancelarRegistroProvisional(idUsuario);
    if (!eliminado) {
      throw new EstadoRegistroInvalidoException(
        'Solo puede cancelarse una cuenta que aún no tenga consentimiento ni línea base.',
      );
    }

    return {
      mensaje:
        'El proceso fue cancelado y los datos provisionales se eliminaron.',
    };
  }
}
