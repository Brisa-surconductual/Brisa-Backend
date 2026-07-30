import { Module, Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AccessTokenService } from './application/ports/access-token.service';
import { EmailSender } from './application/ports/email-sender';
import { PasswordHasher } from './application/ports/password-hasher';
import { RecoveryTokenService } from './application/ports/recovery-token.service';
import { Reloj } from './application/ports/reloj';
import { ActualizarEstadoSesionUseCase } from './application/use-cases/actualizar-estado-sesion.use-case';
import { ActualizarRevisionRegistroUseCase } from './application/use-cases/actualizar-revision-registro.use-case';
import { CancelarRegistroProvisionalUseCase } from './application/use-cases/cancelar-registro-provisional.use-case';
import { CerrarSesionUseCase } from './application/use-cases/cerrar-sesion.use-case';
import { CompletarConsentimientoLineaBaseUseCase } from './application/use-cases/completar-consentimiento-linea-base.use-case';
import { ConfirmarRegistroUseCase } from './application/use-cases/confirmar-registro.use-case';
import { ConsultarConsentimientoVigenteUseCase } from './application/use-cases/consultar-consentimiento-vigente.use-case';
import { ConsultarRevisionRegistroUseCase } from './application/use-cases/consultar-revision-registro.use-case';
import { ConsultarSesionActualUseCase } from './application/use-cases/consultar-sesion-actual.use-case';
import { CreacionUsuarioUseCase } from './application/use-cases/creacion-usuario.use-case';
import { IniciarSesionUseCase } from './application/use-cases/iniciar-sesion.use-case';
import { ReaceptarConsentimientoUseCase } from './application/use-cases/reaceptar-consentimiento.use-case';
import { RestablecerContrasenaUseCase } from './application/use-cases/restablecer-contrasena.use-case';
import { SolicitarRecuperacionContrasenaUseCase } from './application/use-cases/solicitar-recuperacion-contrasena.use-case';
import { ValidarSesionUseCase } from './application/use-cases/validar-sesion.use-case';
import { RecuperacionContrasenaRepository } from './domain/repositories/recuperacion-contrasena.repository';
import { RegistroRepository } from './domain/repositories/registro.repository';
import { SesionRepository } from './domain/repositories/sesion.repository';
import { UsuarioRepository } from './domain/repositories/user.repository';
import { NodemailerEmailSender } from './infrastructure/messaging/nodemailer-email-sender';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma-usuario.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { NestJwtAccessTokenService } from './infrastructure/security/nest-jwt-access-token.service';
import { NodeRecoveryTokenService } from './infrastructure/security/node-recovery-token.service';
import { SystemClock } from './infrastructure/time/system-clock';
import { JwtSessionGuard } from './presentation/auth/jwt-session.guard';
import { PermissionsGuard } from './presentation/auth/permissions.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import { RecuperacionController } from './presentation/controllers/recuperacion.controller';
import { RegistroController } from './presentation/controllers/registro.controller';
import { UsuariosController } from './presentation/controllers/usuarios.controller';
import { UsuarioExceptionFilter } from './presentation/filters/usuario-exception.filter';

const repositoryProviders: Provider[] = [
  PrismaUsuarioRepository,
  {
    provide: UsuarioRepository,
    useExisting: PrismaUsuarioRepository,
  },
  {
    provide: RegistroRepository,
    useExisting: PrismaUsuarioRepository,
  },
  {
    provide: SesionRepository,
    useExisting: PrismaUsuarioRepository,
  },
  {
    provide: RecuperacionContrasenaRepository,
    useExisting: PrismaUsuarioRepository,
  },
];

const adapterProviders: Provider[] = [
  { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  { provide: AccessTokenService, useClass: NestJwtAccessTokenService },
  { provide: RecoveryTokenService, useClass: NodeRecoveryTokenService },
  { provide: EmailSender, useClass: NodemailerEmailSender },
  { provide: Reloj, useClass: SystemClock },
];

const useCaseProviders: Provider[] = [
  {
    provide: CreacionUsuarioUseCase,
    useFactory: (users: UsuarioRepository, hasher: PasswordHasher) =>
      new CreacionUsuarioUseCase(users, hasher),
    inject: [UsuarioRepository, PasswordHasher],
  },
  {
    provide: IniciarSesionUseCase,
    useFactory: (
      users: UsuarioRepository,
      sessions: SesionRepository,
      hasher: PasswordHasher,
      tokens: AccessTokenService,
    ) =>
      new IniciarSesionUseCase(
        users,
        sessions,
        hasher,
        tokens,
        positiveIntegerEnv('SESSION_INACTIVITY_MINUTES', 15),
      ),
    inject: [
      UsuarioRepository,
      SesionRepository,
      PasswordHasher,
      AccessTokenService,
    ],
  },
  {
    provide: ValidarSesionUseCase,
    useFactory: (
      sessions: SesionRepository,
      users: UsuarioRepository,
      clock: Reloj,
    ) =>
      new ValidarSesionUseCase(
        sessions,
        users,
        clock,
        positiveIntegerEnv('SESSION_BACKGROUND_MINUTES', 15),
      ),
    inject: [SesionRepository, UsuarioRepository, Reloj],
  },
  {
    provide: CerrarSesionUseCase,
    useFactory: (sessions: SesionRepository, clock: Reloj) =>
      new CerrarSesionUseCase(sessions, clock),
    inject: [SesionRepository, Reloj],
  },
  {
    provide: ActualizarEstadoSesionUseCase,
    useFactory: (sessions: SesionRepository, clock: Reloj) =>
      new ActualizarEstadoSesionUseCase(sessions, clock),
    inject: [SesionRepository, Reloj],
  },
  {
    provide: ConsultarSesionActualUseCase,
    useFactory: (users: UsuarioRepository) =>
      new ConsultarSesionActualUseCase(users),
    inject: [UsuarioRepository],
  },
  {
    provide: ConsultarConsentimientoVigenteUseCase,
    useFactory: (registration: RegistroRepository) =>
      new ConsultarConsentimientoVigenteUseCase(registration),
    inject: [RegistroRepository],
  },
  {
    provide: CompletarConsentimientoLineaBaseUseCase,
    useFactory: (users: UsuarioRepository, registration: RegistroRepository) =>
      new CompletarConsentimientoLineaBaseUseCase(users, registration),
    inject: [UsuarioRepository, RegistroRepository],
  },
  {
    provide: ConsultarRevisionRegistroUseCase,
    useFactory: (registration: RegistroRepository) =>
      new ConsultarRevisionRegistroUseCase(registration),
    inject: [RegistroRepository],
  },
  {
    provide: ActualizarRevisionRegistroUseCase,
    useFactory: (registration: RegistroRepository) =>
      new ActualizarRevisionRegistroUseCase(registration),
    inject: [RegistroRepository],
  },
  {
    provide: ReaceptarConsentimientoUseCase,
    useFactory: (users: UsuarioRepository, registration: RegistroRepository) =>
      new ReaceptarConsentimientoUseCase(users, registration),
    inject: [UsuarioRepository, RegistroRepository],
  },
  {
    provide: ConfirmarRegistroUseCase,
    useFactory: (registration: RegistroRepository) =>
      new ConfirmarRegistroUseCase(registration),
    inject: [RegistroRepository],
  },
  {
    provide: CancelarRegistroProvisionalUseCase,
    useFactory: (users: UsuarioRepository, registration: RegistroRepository) =>
      new CancelarRegistroProvisionalUseCase(users, registration),
    inject: [UsuarioRepository, RegistroRepository],
  },
  {
    provide: SolicitarRecuperacionContrasenaUseCase,
    useFactory: (
      users: UsuarioRepository,
      recovery: RecuperacionContrasenaRepository,
      tokens: RecoveryTokenService,
      email: EmailSender,
      clock: Reloj,
    ) =>
      new SolicitarRecuperacionContrasenaUseCase(
        users,
        recovery,
        tokens,
        email,
        clock,
      ),
    inject: [
      UsuarioRepository,
      RecuperacionContrasenaRepository,
      RecoveryTokenService,
      EmailSender,
      Reloj,
    ],
  },
  {
    provide: RestablecerContrasenaUseCase,
    useFactory: (
      users: UsuarioRepository,
      recovery: RecuperacionContrasenaRepository,
      tokens: RecoveryTokenService,
      hasher: PasswordHasher,
      clock: Reloj,
    ) =>
      new RestablecerContrasenaUseCase(users, recovery, tokens, hasher, clock),
    inject: [
      UsuarioRepository,
      RecuperacionContrasenaRepository,
      RecoveryTokenService,
      PasswordHasher,
      Reloj,
    ],
  },
];

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [
    UsuariosController,
    AuthController,
    RecuperacionController,
    RegistroController,
  ],
  providers: [
    ...repositoryProviders,
    ...adapterProviders,
    ...useCaseProviders,
    JwtSessionGuard,
    PermissionsGuard,
    { provide: APP_FILTER, useClass: UsuarioExceptionFilter },
  ],
})
export class UsersModule {}

function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}
