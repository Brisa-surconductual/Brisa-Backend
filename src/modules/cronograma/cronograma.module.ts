import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CronogramaApplicationProviders } from './application/cronograma.providers';
import { InicializarCronogramaUsuarioUseCase } from './application/use-cases/inicializar-cronograma-usuario.use-case';
import { CronogramaInfrastructureProviders } from './infrastructure/cronograma.providers';
import { CronogramaPresentationProviders } from './presentation/cronograma.providers';
import { UsersModule } from '../usuarios/users.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { AutorizarConsumoEventoContenidoService } from './application/service/autorizar-consumo-evento-contenido.service';
import { CalcularUbicacionTemporalUsuarioUseCase } from './application/use-cases/calcular-ubicacion-temporal-usuario.use-case';

@Module({
  imports: [PrismaModule, UsersModule],

  controllers: [...CronogramaPresentationProviders],
  providers: [
    ...CronogramaApplicationProviders,
    ...CronogramaInfrastructureProviders,
    RolesGuard,
  ],

  exports: [
    InicializarCronogramaUsuarioUseCase,
    AutorizarConsumoEventoContenidoService,
    CalcularUbicacionTemporalUsuarioUseCase,
  ],
})
export class CronogramaModule {}
