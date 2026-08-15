import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CronogramaApplicationProviders } from './application/cronograma.providers';
import { InicializarCronogramaUsuarioUseCase } from './application/use-cases/inicializar-cronograma-usuario.use-case';
import { CronogramaInfrastructureProviders } from './infrastructure/cronograma.providers';

@Module({
  imports: [PrismaModule],
  providers: [
    ...CronogramaApplicationProviders,
    ...CronogramaInfrastructureProviders,
  ],
  exports: [InicializarCronogramaUsuarioUseCase],
})
export class CronogramaModule {}
