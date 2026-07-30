import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { CredencialesInvalidasException } from '../../domain/exceptions/usuario.exceptions';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { AccessTokenService } from '../ports/access-token.service';
import { PasswordHasher } from '../ports/password-hasher';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export interface IniciarSesionInput {
  correoElectronico: string;
  contrasena: string;
}

export interface IniciarSesionOutput {
  accessToken: string;
  expiresInSeconds: number;
  idSesion: string;
  usuario: {
    id: string;
    correoElectronico: string;
    rol: string;
    estadoRegistro: string;
    siguientePaso: string;
  };
}

export class IniciarSesionUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly sesionRepository: SesionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService,
    private readonly limiteInactividadMinutos: number,
  ) {}

  async execute(input: IniciarSesionInput): Promise<IniciarSesionOutput> {
    const correo = new CorreoElectronico(input.correoElectronico);
    const usuario = await this.usuarioRepository.buscarPorCorreo(
      correo.getValue(),
    );

    if (!usuario || usuario.getEstadoCuenta() !== EstadoCuenta.ACTIVA) {
      throw new CredencialesInvalidasException();
    }

    const contrasenaValida = await this.passwordHasher.compare(
      input.contrasena,
      usuario.getContrasenaHash(),
    );

    if (!contrasenaValida) {
      throw new CredencialesInvalidasException();
    }

    const sesion = await this.sesionRepository.crearSesion(
      usuario.getId(),
      this.limiteInactividadMinutos,
    );

    const accessToken = await this.accessTokenService.emitir({
      sub: usuario.getId(),
      sid: sesion.id,
      rol: usuario.getRol(),
      estadoRegistro: usuario.getEstadoRegistro(),
      type: 'access',
    });

    return {
      accessToken: accessToken.token,
      expiresInSeconds: accessToken.expiresInSeconds,
      idSesion: sesion.id,
      usuario: {
        id: usuario.getId(),
        correoElectronico: usuario.getCorreo().getValue(),
        rol: usuario.getRol(),
        estadoRegistro: usuario.getEstadoRegistro(),
        siguientePaso: obtenerSiguientePaso(usuario.getEstadoRegistro()),
      },
    };
  }
}
