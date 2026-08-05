import { Module } from '@nestjs/common';
import { UsuarioInfraestructureProviders } from './infrastructure/usuario.providers';
import { UsuarioAplicationProviders } from './application/usuario.providers';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuariosController } from './presentation/controllers/usuarios.controller';
import { SesionesController } from './presentation/controllers/sesiones.controller';
import { SesionApplicationProviders } from './application/sesion.providers';
import { SesionInfrastructureProviders } from './infrastructure/sesion.providers';
import { SesionPresentationProviders } from './presentation/sesion-presentation.providers';
@Module({
  controllers: [UsuariosController, SesionesController],

  providers: [
    PrismaService,
    ...UsuarioAplicationProviders,
    ...UsuarioInfraestructureProviders,
    ...SesionApplicationProviders,
    ...SesionInfrastructureProviders,
    ...SesionPresentationProviders,
  ],
})
export class UsersModule {}
