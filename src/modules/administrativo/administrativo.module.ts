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
import { AdministrativoInfrastructureProviders } from './infrastructure/administrativo.providers';
import {
  AdministrativoPresentationControllers,
  AdministrativoPresentationProviders,
} from './presentation/administrativo.providers';
import { SoloLecturaParticipantesMiddleware } from './presentation/middleware/solo-lectura-participantes.middleware';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [...AdministrativoPresentationControllers],
  providers: [
    ...AdministrativoApplicationProviders,
    ...AdministrativoInfrastructureProviders,
    ...AdministrativoPresentationProviders,
  ],
  exports: [AuditoriaService],
})
export class AdministrativoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SoloLecturaParticipantesMiddleware)
      .forRoutes({ path: '{*ruta}', method: RequestMethod.ALL });
  }
}
