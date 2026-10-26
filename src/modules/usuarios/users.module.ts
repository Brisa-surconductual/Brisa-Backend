import { Module } from '@nestjs/common';
import { UsuarioInfraestructureProviders } from './infrastructure/usuario.providers';
import { UsuarioAplicationProviders } from './application/usuario.providers';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuariosController } from './presentation/controllers/usuarios.controller';
import { SesionesController } from './presentation/controllers/sesiones.controller';
import { SesionApplicationProviders } from './application/sesion.providers';
import { SesionInfrastructureProviders } from './infrastructure/sesion.providers';
import { SesionPresentationProviders } from './presentation/sesion-presentation.providers';
import { SesionRepository } from './domain/repositories/sesion.repository';
import { SessionAuthGuard } from './presentation/guards/session-auth.guard';
import { UsuarioRepository } from './domain/repositories/user.repository';
import { SessionConfig } from './application/ports/session-config';
import { SessionCookieConfig } from './application/ports/session-cookie-config';
import { SessionTokenHasher } from './application/ports/session-token-hasher';
import { CsrfSessionGuard } from './presentation/guards/csrf-session.guard';
import { SessionScopeGuard } from './presentation/guards/session-scope.guard';
import { EstadisticasProgramaController } from './presentation/controllers/estadisticas-programa.controller';
import { ConsultarEstadisticasProgramaUseCase } from './application/use-cases/consultar-estadisticas-programa.use-case';
import { EstadisticasProgramaRepository } from './domain/repositories/estadisticas-programa.repository';
import { PrismaEstadisticasProgramaRepository } from './infrastructure/persistence/prisma-estadisticas-programa.repository';

@Module({
  controllers: [
    UsuariosController,
    SesionesController,
    EstadisticasProgramaController,
  ],

  providers: [
    PrismaService,
    ConsultarEstadisticasProgramaUseCase,
    {
      provide: EstadisticasProgramaRepository,
      useClass: PrismaEstadisticasProgramaRepository,
    },
    SessionAuthGuard,
    ...UsuarioAplicationProviders,
    ...UsuarioInfraestructureProviders,
    ...SesionApplicationProviders,
    ...SesionInfrastructureProviders,
    ...SesionPresentationProviders,
  ],

  exports: [
    UsuarioRepository,
    SesionRepository,
    SessionAuthGuard,
    CsrfSessionGuard,
    SessionScopeGuard,
    SessionConfig,
    SessionCookieConfig,
    SessionTokenHasher,
  ],
})
export class UsersModule {}
