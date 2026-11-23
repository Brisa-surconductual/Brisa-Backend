import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RolesGuard } from '../../shared/presentation/guards/role-guard';
import { CronogramaModule } from '../cronograma/cronograma.module';
import { UsersModule } from '../usuarios/users.module';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from './application/ports/auditoria.port';
import { AuditoriaService } from './application/services/auditoria.service';
import { CohortesRepository } from './application/ports/cohortes.repository';
import { ConsultarBitacoraUseCase } from './application/use-cases/consultar-bitacora.use-case';
import { ConsultarCohortesUseCase } from './application/use-cases/consultar-cohortes.use-case';
import { GestionarCohortesUseCase } from './application/use-cases/gestionar-cohortes.use-case';
import { BullMqAuditoriaAdapter } from './infrastructure/messaging/bullmq-auditoria.adapter';
import { PrismaBitacoraRepository } from './infrastructure/persistence/prisma-bitacora.repository';
import { PrismaCohortesRepository } from './infrastructure/persistence/prisma-cohortes.repository';
import { BitacoraController } from './presentation/controllers/bitacora.controller';
import { CohortesController } from './presentation/controllers/cohortes.controller';
import { AccesoBitacoraGuard } from './presentation/guards/acceso-bitacora.guard';
import { SoloLecturaParticipantesMiddleware } from './presentation/middleware/solo-lectura-participantes.middleware';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [BitacoraController, CohortesController],
  providers: [
    AuditoriaService,
    ConsultarBitacoraUseCase,
    ConsultarCohortesUseCase,
    GestionarCohortesUseCase,
    AccesoBitacoraGuard,
    RolesGuard,
    { provide: BitacoraRepository, useClass: PrismaBitacoraRepository },
    { provide: CohortesRepository, useClass: PrismaCohortesRepository },
    { provide: ColaAuditoriaPort, useClass: BullMqAuditoriaAdapter },
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
