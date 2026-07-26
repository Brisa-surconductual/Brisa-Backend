import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoCodigo } from '../../domain/enums/estado-codigo-enum';
import { LimiteRecuperacionExcedidoException } from '../../domain/exceptions/usuario.exceptions';
import {
  NuevaSolicitudRecuperacion,
  RecuperacionContrasenaRepository,
  SolicitudRecuperacionPersistida,
} from '../../domain/repositories/recuperacion-contrasena.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { EmailSender, MensajeRecuperacion } from '../ports/email-sender';
import { RecoveryTokenService } from '../ports/recovery-token.service';
import { Reloj } from '../ports/reloj';
import {
  MENSAJE_RECUPERACION_GENERICO,
  SolicitarRecuperacionContrasenaUseCase,
} from './solicitar-recuperacion-contrasena.use-case';

class RecoveryUserRepository implements UsuarioRepository {
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

class RecoveryRepositoryFake implements RecuperacionContrasenaRepository {
  attempts = 0;
  registered: NuevaSolicitudRecuperacion[] = [];

  async contarSolicitudesDesde(): Promise<number> {
    return this.attempts;
  }
  async registrar(solicitud: NuevaSolicitudRecuperacion): Promise<void> {
    this.registered.push(solicitud);
  }
  async buscarPorCodigoHash(): Promise<SolicitudRecuperacionPersistida | null> {
    return null;
  }
  async marcarExpirada(): Promise<void> {}
  async actualizarContrasenaYConsumirCodigo(): Promise<void> {}
}

class RecoveryTokenFake implements RecoveryTokenService {
  generar(): string {
    return 'raw-recovery-token';
  }
  hash(token: string): string {
    return `hash:${token}`;
  }
}

class EmailFake implements EmailSender {
  sent: MensajeRecuperacion | null = null;
  async enviarRecuperacion(mensaje: MensajeRecuperacion): Promise<void> {
    this.sent = mensaje;
  }
  async enviarActivacionPendiente(): Promise<void> {}
}

class RecoveryClock implements Reloj {
  ahora(): Date {
    return new Date('2026-07-25T18:00:00.000Z');
  }
}

describe('SolicitarRecuperacionContrasenaUseCase', () => {
  it('guarda solo el hash y mantiene una respuesta genérica', async () => {
    const user = Usuario.crear(
      new CorreoElectronico('student@example.com'),
      'stored-hash',
    );
    const repository = new RecoveryRepositoryFake();
    const email = new EmailFake();
    const useCase = new SolicitarRecuperacionContrasenaUseCase(
      new RecoveryUserRepository(user),
      repository,
      new RecoveryTokenFake(),
      email,
      new RecoveryClock(),
    );

    const output = await useCase.execute('student@example.com', '127.0.0.1');

    expect(output.mensaje).toBe(MENSAJE_RECUPERACION_GENERICO);
    expect(repository.registered[0].codigoHash).toBe('hash:raw-recovery-token');
    expect(repository.registered[0].estado).toBe(EstadoCodigo.ACTIVO);
    expect(email.sent?.token).toBe('raw-recovery-token');
  });

  it('no revela si el correo no existe', async () => {
    const repository = new RecoveryRepositoryFake();
    const useCase = new SolicitarRecuperacionContrasenaUseCase(
      new RecoveryUserRepository(null),
      repository,
      new RecoveryTokenFake(),
      new EmailFake(),
      new RecoveryClock(),
    );

    const output = await useCase.execute('unknown@example.com', '127.0.0.1');

    expect(output.mensaje).toBe(MENSAJE_RECUPERACION_GENERICO);
    expect(repository.registered[0].codigoHash).toBeNull();
  });

  it('bloquea el cuarto intento en una hora por correo e IP', async () => {
    const repository = new RecoveryRepositoryFake();
    repository.attempts = 3;
    const useCase = new SolicitarRecuperacionContrasenaUseCase(
      new RecoveryUserRepository(null),
      repository,
      new RecoveryTokenFake(),
      new EmailFake(),
      new RecoveryClock(),
    );

    await expect(
      useCase.execute('unknown@example.com', '127.0.0.1'),
    ).rejects.toBeInstanceOf(LimiteRecuperacionExcedidoException);
  });
});
