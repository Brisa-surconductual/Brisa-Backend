import { Usuario } from '../../domain/entities/usuarios.entity';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { Rol } from '../../domain/enums/rol.enum';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';
import {
  SesionPersistida,
  SesionRepository,
} from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { Reloj } from '../ports/reloj';
import { ValidarSesionUseCase } from './validar-sesion.use-case';

class FixedClock implements Reloj {
  constructor(private readonly date: Date) {}
  ahora(): Date {
    return this.date;
  }
}

class SessionFake implements SesionRepository {
  closeReason: MotivoCierre | null = null;
  touched = false;

  constructor(private readonly session: SesionPersistida) {}
  async crearSesion(): Promise<SesionPersistida> {
    return this.session;
  }
  async buscarSesionPorId(): Promise<SesionPersistida | null> {
    return this.session;
  }
  async registrarInteraccion(): Promise<void> {
    this.touched = true;
  }
  async actualizarEstadoAplicacion(): Promise<void> {}
  async cerrar(_id: string, motivo: MotivoCierre): Promise<boolean> {
    this.closeReason = motivo;
    return true;
  }
  async cerrarTodasDelUsuario(): Promise<void> {}
}

class SessionUserFake implements UsuarioRepository {
  constructor(private readonly user: Usuario) {}
  async crear(): Promise<void> {}
  async buscarPorCorreo(): Promise<Usuario | null> {
    return this.user;
  }
  async buscarPorId(): Promise<Usuario | null> {
    return this.user;
  }
  async actualizarContrasena(): Promise<void> {}
}

describe('ValidarSesionUseCase', () => {
  const user = Usuario.crear(
    new CorreoElectronico('student@example.com'),
    'hash',
  );
  const claims = {
    sub: user.getId(),
    sid: 'session-id',
    rol: Rol.ESTUDIANTE,
    estadoRegistro: EstadoRegistro.PENDIENTE_CONSENTIMIENTO,
    type: 'access' as const,
  };

  it('cierra la sesión al alcanzar 15 minutos de inactividad', async () => {
    const now = new Date('2026-07-25T18:00:00.000Z');
    const sessions = new SessionFake({
      id: 'session-id',
      idUsuario: user.getId(),
      fechaInicio: new Date('2026-07-25T17:00:00.000Z'),
      fechaUltimaInteraccion: new Date('2026-07-25T17:45:00.000Z'),
      limiteInactividadMinutos: 15,
      estadoAplicacion: EstadoAplicacion.ACTIVA,
      activa: true,
    });
    const useCase = new ValidarSesionUseCase(
      sessions,
      new SessionUserFake(user),
      new FixedClock(now),
      15,
    );

    await expect(useCase.execute(claims)).rejects.toBeInstanceOf(
      SesionInvalidaException,
    );
    expect(sessions.closeReason).toBe(MotivoCierre.INACTIVIDAD);
  });

  it('registra interacción cuando la sesión sigue vigente', async () => {
    const now = new Date('2026-07-25T18:00:00.000Z');
    const sessions = new SessionFake({
      id: 'session-id',
      idUsuario: user.getId(),
      fechaInicio: new Date('2026-07-25T17:00:00.000Z'),
      fechaUltimaInteraccion: new Date('2026-07-25T17:50:00.000Z'),
      limiteInactividadMinutos: 15,
      estadoAplicacion: EstadoAplicacion.ACTIVA,
      activa: true,
    });
    const useCase = new ValidarSesionUseCase(
      sessions,
      new SessionUserFake(user),
      new FixedClock(now),
      15,
    );

    await useCase.execute(claims);
    expect(sessions.touched).toBe(true);
    expect(sessions.closeReason).toBeNull();
  });
});
