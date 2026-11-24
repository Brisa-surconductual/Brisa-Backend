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
import { ParticipantesCohorteRepository } from './application/ports/participantes-cohorte.repository';
import { SeguimientoAgregadoPort } from './application/ports/seguimiento-agregado.port';
import { VistasConductualesRepository } from './application/ports/vistas-conductuales.repository';
import { ConsultarBitacoraUseCase } from './application/use-cases/consultar-bitacora.use-case';
import { ConsultarCohortesUseCase } from './application/use-cases/consultar-cohortes.use-case';
import { ConsultarVistaConductualUseCase } from './application/use-cases/consultar-vista-conductual.use-case';
import { GestionarCohortesUseCase } from './application/use-cases/gestionar-cohortes.use-case';
import { GestionarParticipantesCohorteUseCase } from './application/use-cases/gestionar-participantes-cohorte.use-case';
import { BullMqAuditoriaAdapter } from './infrastructure/messaging/bullmq-auditoria.adapter';
import { PrismaBitacoraRepository } from './infrastructure/persistence/prisma-bitacora.repository';
import { PrismaCohortesRepository } from './infrastructure/persistence/prisma-cohortes.repository';
import { PrismaParticipantesCohorteRepository } from './infrastructure/persistence/prisma-participantes-cohorte.repository';
import { PrismaVistasConductualesRepository } from './infrastructure/persistence/prisma-vistas-conductuales.repository';
import { BitacoraController } from './presentation/controllers/bitacora.controller';
import { CohortesController } from './presentation/controllers/cohortes.controller';
import { ParticipantesCohorteController } from './presentation/controllers/participantes-cohorte.controller';
import { VistaConductualController } from './presentation/controllers/vista-conductual.controller';
import { AccesoBitacoraGuard } from './presentation/guards/acceso-bitacora.guard';
import { SoloLecturaParticipantesMiddleware } from './presentation/middleware/solo-lectura-participantes.middleware';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [
    BitacoraController,
    CohortesController,
    ParticipantesCohorteController,
    VistaConductualController,
  ],
  providers: [
    AuditoriaService,
    ConsultarBitacoraUseCase,
    ConsultarCohortesUseCase,
    ConsultarVistaConductualUseCase,
    GestionarCohortesUseCase,
    GestionarParticipantesCohorteUseCase,
    AccesoBitacoraGuard,
    RolesGuard,
    { provide: BitacoraRepository, useClass: PrismaBitacoraRepository },
    { provide: CohortesRepository, useClass: PrismaCohortesRepository },
    {
      provide: ParticipantesCohorteRepository,
      useClass: PrismaParticipantesCohorteRepository,
    },
    { provide: ColaAuditoriaPort, useClass: BullMqAuditoriaAdapter },
    {
      provide: VistasConductualesRepository,
      useClass: PrismaVistasConductualesRepository,
    },
    {
      provide: SeguimientoAgregadoPort,
      // Reemplazar con el proveedor real cuando M05 publique RF-78.
      useValue: {
        obtener: (id_cohorte: string) =>
          Promise.resolve({ id_cohorte, estado: 'NO_DISPONIBLE' }),
      } satisfies SeguimientoAgregadoPort,
    },
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
