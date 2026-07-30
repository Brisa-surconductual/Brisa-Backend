import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Rol } from '../../domain/enums/rol.enum';
import {
  ContrasenasNoCoincidenException,
  CorreoDuplicadoException,
} from '../../domain/exceptions/usuario.exceptions';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { CreacionUsuarioUseCase } from './creacion-usuario.use-case';

class InMemoryUsuarioRepository implements UsuarioRepository {
  readonly users: Usuario[] = [];

  async crear(usuario: Usuario): Promise<void> {
    this.users.push(usuario);
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return (
      this.users.find((usuario) => usuario.getCorreo().getValue() === correo) ??
      null
    );
  }

  async buscarPorId(idUsuario: string): Promise<Usuario | null> {
    return this.users.find((usuario) => usuario.getId() === idUsuario) ?? null;
  }

  async actualizarContrasena(
    idUsuario: string,
    contrasenaHash: string,
  ): Promise<void> {
    const usuario = await this.buscarPorId(idUsuario);
    usuario?.actualizarContrasena(contrasenaHash);
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

describe('CreacionUsuarioUseCase', () => {
  let repository: InMemoryUsuarioRepository;
  let useCase: CreacionUsuarioUseCase;

  beforeEach(() => {
    repository = new InMemoryUsuarioRepository();
    useCase = new CreacionUsuarioUseCase(repository, new FakePasswordHasher());
  });

  it('crea únicamente las credenciales con rol y estado controlados', async () => {
    const output = await useCase.execute({
      correoElectronico: 'Estudiante@Example.com',
      contrasena: 'Segura1!',
      confirmarContrasena: 'Segura1!',
    });

    expect(repository.users).toHaveLength(1);
    const user = repository.users[0];
    expect(user.getCorreo().getValue()).toBe('estudiante@example.com');
    expect(user.getContrasenaHash()).toBe('hashed:Segura1!');
    expect(user.getRol()).toBe(Rol.ESTUDIANTE);
    expect(user.getEstadoRegistro()).toBe(
      EstadoRegistro.PENDIENTE_CONSENTIMIENTO,
    );
    expect(user.getIdConsentimiento()).toBeNull();
    expect(output.siguientePaso).toBe('CONSENTIMIENTO_LINEA_BASE');
  });

  it('rechaza contraseñas cuya confirmación no coincide', async () => {
    await expect(
      useCase.execute({
        correoElectronico: 'student@example.com',
        contrasena: 'Segura1!',
        confirmarContrasena: 'Otra1!',
      }),
    ).rejects.toBeInstanceOf(ContrasenasNoCoincidenException);
  });

  it('rechaza correos duplicados', async () => {
    const input = {
      correoElectronico: 'student@example.com',
      contrasena: 'Segura1!',
      confirmarContrasena: 'Segura1!',
    };
    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      CorreoDuplicadoException,
    );
  });
});
