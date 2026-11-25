import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CronogramaModule } from '../cronograma/cronograma.module';
import { UsersModule } from '../usuarios/users.module';
import { AdministrativoApplicationProviders } from './application/administrativo.providers';
import { AuditoriaService } from './application/services/auditoria.service';
import { VerificarPermisoIndividualUseCase } from './application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { AdministrativoInfrastructureProviders } from './infrastructure/administrativo.providers';
import {
  AdministrativoPresentationControllers,
  AdministrativoPresentationProviders,
} from './presentation/administrativo.providers';
import { PermisoIndividualGuard } from './presentation/guards/permiso-individual.guard';
import { SoloLecturaParticipantesMiddleware } from './presentation/middleware/solo-lectura-participantes.middleware';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [...AdministrativoPresentationControllers],
  providers: [
    ...AdministrativoApplicationProviders,
    ...AdministrativoInfrastructureProviders,
    ...AdministrativoPresentationProviders,
  ],
  exports: [
    AuditoriaService,
    PermisoIndividualGuard,
    VerificarPermisoIndividualUseCase,
  ],
})
export class AdministrativoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SoloLecturaParticipantesMiddleware)
      .forRoutes({ path: '{*ruta}', method: RequestMethod.ALL });
  }
}
