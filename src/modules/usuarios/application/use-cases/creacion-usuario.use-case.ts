import { Usuario } from '../../domain/entities/usuarios.entity';
import {
  ContrasenasNoCoincidenException,
  CorreoDuplicadoException,
} from '../../domain/exceptions/usuario.exceptions';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { Contrasena } from '../../domain/value-objects/contrasena.vo';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { PasswordHasher } from '../ports/password-hasher';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export interface CrearUsuarioInput {
  correoElectronico: string;
  contrasena: string;
  confirmarContrasena: string;
}

export interface CrearUsuarioOutput {
  idUsuario: string;
  correoElectronico: string;
  estadoRegistro: string;
  siguientePaso: string;
  mensaje: string;
}

export class CreacionUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CrearUsuarioInput): Promise<CrearUsuarioOutput> {
    const correo = new CorreoElectronico(input.correoElectronico);
    const contrasena = new Contrasena(input.contrasena);

    if (input.contrasena !== input.confirmarContrasena) {
      throw new ContrasenasNoCoincidenException();
    }

    const existente = await this.usuarioRepository.buscarPorCorreo(
      correo.getValue(),
    );

    if (existente) {
      throw new CorreoDuplicadoException();
    }

    const contrasenaHash = await this.passwordHasher.hash(contrasena.value);
    const usuario = Usuario.crear(correo, contrasenaHash);
    await this.usuarioRepository.crear(usuario);

    return {
      idUsuario: usuario.getId(),
      correoElectronico: usuario.getCorreo().getValue(),
      estadoRegistro: usuario.getEstadoRegistro(),
      siguientePaso: obtenerSiguientePaso(usuario.getEstadoRegistro()),
      mensaje: 'Cuenta creada correctamente.',
    };
  }
}
