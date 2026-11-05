import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { UsersModule } from '../usuarios/users.module';
import { CronogramaModule } from '../cronograma/cronograma.module';
import { ChatApplicationProviders } from './application/chat.providers';
import { ChatInfrastructureProviders } from './infrastructure/chat.providers';
import { ChatPresentationProviders } from './presentation/chat.providers';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { ConsultarPublicadoPersonalizadoUseCase } from './application/use-cases/arbol-personalizado/consultar-publicado-personalizado.use-case';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [...ChatPresentationProviders],
  providers: [
    ...ChatApplicationProviders,
    ...ChatInfrastructureProviders,
    RolesGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [ConsultarPublicadoPersonalizadoUseCase],
})
export class ChatModule {}
