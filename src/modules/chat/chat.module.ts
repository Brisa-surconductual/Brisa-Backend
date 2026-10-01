import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { UsersModule } from '../usuarios/users.module';
import { ChatApplicationProviders } from './application/chat.providers';
import { ChatInfrastructureProviders } from './infrastructure/chat.providers';
import { ChatPresentationProviders } from './presentation/chat.providers';
import { ConsultarPublicadoPersonalizadoUseCase } from './application/use-cases/gestionar-arbol-personalizado.use-cases';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [...ChatPresentationProviders],
  providers: [
    ...ChatApplicationProviders,
    ...ChatInfrastructureProviders,
    RolesGuard,
  ],
  exports: [ConsultarPublicadoPersonalizadoUseCase],
})
export class ChatModule {}
