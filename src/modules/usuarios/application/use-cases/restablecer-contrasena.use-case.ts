import { EstadoCodigo } from '../../domain/enums/estado-codigo-enum';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import {
  CodigoRecuperacionExpiradoException,
  CodigoRecuperacionInvalidoException,
  ContrasenasNoCoincidenException,
} from '../../domain/exceptions/usuario.exceptions';
import { RecuperacionContrasenaRepository } from '../../domain/repositories/recuperacion-contrasena.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { Contrasena } from '../../domain/value-objects/contrasena.vo';
import { PasswordHasher } from '../ports/password-hasher';
import { RecoveryTokenService } from '../ports/recovery-token.service';
import { Reloj } from '../ports/reloj';

export interface RestablecerContrasenaInput {
  token: string;
  nuevaContrasena: string;
  confirmarNuevaContrasena: string;
}

export class RestablecerContrasenaUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly recuperacionRepository: RecuperacionContrasenaRepository,
    private readonly tokenService: RecoveryTokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly reloj: Reloj,
  ) {}

  async execute(input: RestablecerContrasenaInput) {
    if (input.nuevaContrasena !== input.confirmarNuevaContrasena) {
      throw new ContrasenasNoCoincidenException();
    }

    const contrasena = new Contrasena(input.nuevaContrasena);
    const solicitud = await this.recuperacionRepository.buscarPorCodigoHash(
      this.tokenService.hash(input.token),
    );

    if (
      !solicitud ||
      !solicitud.idUsuario ||
      solicitud.estado !== EstadoCodigo.ACTIVO ||
      !solicitud.fechaExpiracion
    ) {
      throw new CodigoRecuperacionInvalidoException();
    }

    if (solicitud.fechaExpiracion <= this.reloj.ahora()) {
      await this.recuperacionRepository.marcarExpirada(solicitud.id);
      throw new CodigoRecuperacionExpiradoException();
    }

    const usuario = await this.usuarioRepository.buscarPorId(
      solicitud.idUsuario,
    );
    if (!usuario || usuario.getEstadoCuenta() !== EstadoCuenta.ACTIVA) {
      throw new CodigoRecuperacionInvalidoException();
    }

    const hash = await this.passwordHasher.hash(contrasena.value);
    await this.recuperacionRepository.actualizarContrasenaYConsumirCodigo(
      solicitud.id,
      usuario.getId(),
      hash,
    );

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}
