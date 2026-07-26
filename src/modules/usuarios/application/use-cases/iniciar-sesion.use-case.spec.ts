import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { CredencialesInvalidasException } from '../../domain/exceptions/usuario.exceptions';
import {
  SesionPersistida,
  SesionRepository,
} from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import {
  AccessTokenClaims,
  AccessTokenEmitido,
  AccessTokenService,
} from '../ports/access-token.service';
import { PasswordHasher } from '../ports/password-hasher';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

class LoginUserRepository implements UsuarioRepository {
  constructor(private readonly user: Usuario | null) {}
  async crear(): Promise<void> {}
  async buscarPorCorreo(): Promise<Usuario | null> {
    return this.user;
  }
  async buscarPorId(): Promise<Usuario | null> {
    return this.user;
  }
  async actualizarContrasena(): Promise<void> {}
}

class LoginSessionRepository implements SesionRepository {
  created = false;

  async crearSesion(
    idUsuario: string,
    limiteInactividadMinutos: number,
  ): Promise<SesionPersistida> {
    this.created = true;
    return {
      id: 'session-id',
      idUsuario,
      fechaInicio: new Date(),
      fechaUltimaInteraccion: new Date(),
      limiteInactividadMinutos,
      estadoAplicacion: EstadoAplicacion.ACTIVA,
      activa: true,
    };
  }
  async buscarSesionPorId(): Promise<SesionPersistida | null> {
    return null;
  }
  async registrarInteraccion(): Promise<void> {}
  async actualizarEstadoAplicacion(): Promise<void> {}
  async cerrar(): Promise<boolean> {
    return true;
  }
  async cerrarTodasDelUsuario(
    _idUsuario: string,
    _motivo: MotivoCierre,
    _fecha: Date,
  ): Promise<void> {}
}

class LoginPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return password;
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return password === 'Segura1!' && hash === 'stored-hash';
  }
}

class LoginTokenService implements AccessTokenService {
  issuedClaims: AccessTokenClaims | null = null;
  async emitir(claims: AccessTokenClaims): Promise<AccessTokenEmitido> {
    this.issuedClaims = claims;
    return { token: 'signed.jwt', expiresInSeconds: 900 };
  }
  async verificar(): Promise<AccessTokenClaims> {
    throw new Error('Not needed in this test.');
  }
}

describe('IniciarSesionUseCase', () => {
  it('crea una sesión y emite un JWT con el id de sesión', async () => {
    const user = Usuario.crear(
      new CorreoElectronico('student@example.com'),
      'stored-hash',
    );
    const sessions = new LoginSessionRepository();
    const tokens = new LoginTokenService();
    const useCase = new IniciarSesionUseCase(
      new LoginUserRepository(user),
      sessions,
      new LoginPasswordHasher(),
      tokens,
      15,
    );

    const result = await useCase.execute({
      correoElectronico: 'student@example.com',
      contrasena: 'Segura1!',
    });

    expect(sessions.created).toBe(true);
    expect(tokens.issuedClaims?.sid).toBe('session-id');
    expect(result.accessToken).toBe('signed.jwt');
    expect(result.usuario.siguientePaso).toBe('CONSENTIMIENTO_LINEA_BASE');
  });

  it('usa un error genérico cuando el usuario no existe', async () => {
    const useCase = new IniciarSesionUseCase(
      new LoginUserRepository(null),
      new LoginSessionRepository(),
      new LoginPasswordHasher(),
      new LoginTokenService(),
      15,
    );

    await expect(
      useCase.execute({
        correoElectronico: 'unknown@example.com',
        contrasena: 'incorrecta',
      }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasException);
  });
});
