import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { UsersModule } from '../usuarios/users.module';
import { CronogramaModule } from '../cronograma/cronograma.module';
import { AdministrativoModule } from '../administrativo/administrativo.module';
import { ChatApplicationProviders } from './application/chat.providers';
import { PerfilClinicoVigentePort } from './application/ports/perfil-clinico-vigente.port';
import { VariablesEtiquetadasPort } from './application/ports/variables-etiquetadas.port';
import { TrazabilidadPort } from './application/ports/trazabilidad-sesion.port';
import { ChatInfrastructureProviders } from './infrastructure/chat.providers';
import { ChatPresentationProviders } from './presentation/chat.providers';
import { ErrorConversacionalFilter } from './presentation/filters/error-conversacional.filter';
import { ConsultarPublicadoPersonalizadoUseCase } from './application/use-cases/arbol-personalizado/consultar-publicado-personalizado.use-case';

@Module({
  // AdministrativoModule aporta el guard de permisos individuales (RF-04).
  imports: [PrismaModule, UsersModule, CronogramaModule, AdministrativoModule],
  controllers: [...ChatPresentationProviders],
  providers: [
    ...ChatApplicationProviders,
    ...ChatInfrastructureProviders,
    RolesGuard,
    { provide: APP_FILTER, useClass: ErrorConversacionalFilter },
  ],
  exports: [
    ConsultarPublicadoPersonalizadoUseCase,
    PerfilClinicoVigentePort,
    VariablesEtiquetadasPort,
    TrazabilidadPort,
  ],
})
export class ChatModule {}
