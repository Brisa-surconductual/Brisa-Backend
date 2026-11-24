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
import { EvolucionSeguimientoPort } from './application/ports/evolucion-seguimiento.port';
import { CohortesRepository } from './application/ports/cohortes.repository';
import { ParticipantesCohorteRepository } from './application/ports/participantes-cohorte.repository';
import { fuenteAgregadaNoDisponible } from './application/ports/fuente-vista-agregada.port';
import { NarrativaAgregadaPort } from './application/ports/narrativa-agregada.port';
import { NotificacionesAgregadasPort } from './application/ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from './application/ports/seguimiento-agregado.port';
import { VistasAgregadasRepository } from './application/ports/vistas-agregadas.repository';
import { ConsultarBitacoraUseCase } from './application/use-cases/consultar-bitacora.use-case';
import { ConsultarCohortesUseCase } from './application/use-cases/consultar-cohortes.use-case';
import { ConsultarEvolucionTemporalUseCase } from './application/use-cases/consultar-evolucion-temporal.use-case';
import { ConsultarVistaAgregadaUseCase } from './application/use-cases/consultar-vista-agregada.use-case';
import { ConsultarVistaNarrativaUseCase } from './application/use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from './application/use-cases/consultar-vista-notificaciones.use-case';
import { ConsultarVistaConductualUseCase } from './application/use-cases/consultar-vista-conductual.use-case';
import { GestionarCohortesUseCase } from './application/use-cases/gestionar-cohortes.use-case';
import { GestionarParticipantesCohorteUseCase } from './application/use-cases/gestionar-participantes-cohorte.use-case';
import { BullMqAuditoriaAdapter } from './infrastructure/messaging/bullmq-auditoria.adapter';
import { PrismaBitacoraRepository } from './infrastructure/persistence/prisma-bitacora.repository';
import { PrismaCohortesRepository } from './infrastructure/persistence/prisma-cohortes.repository';
import { PrismaParticipantesCohorteRepository } from './infrastructure/persistence/prisma-participantes-cohorte.repository';
import { PrismaVistasAgregadasRepository } from './infrastructure/persistence/prisma-vistas-agregadas.repository';
import { BitacoraController } from './presentation/controllers/bitacora.controller';
import { CohortesController } from './presentation/controllers/cohortes.controller';
import { EvolucionTemporalController } from './presentation/controllers/evolucion-temporal.controller';
import { ParticipantesCohorteController } from './presentation/controllers/participantes-cohorte.controller';
import { VistaConductualController } from './presentation/controllers/vista-conductual.controller';
import { VistasAgregadasController } from './presentation/controllers/vistas-agregadas.controller';
import { AccesoBitacoraGuard } from './presentation/guards/acceso-bitacora.guard';
import { SoloLecturaParticipantesMiddleware } from './presentation/middleware/solo-lectura-participantes.middleware';

@Module({
  imports: [PrismaModule, UsersModule, CronogramaModule],
  controllers: [
    BitacoraController,
    CohortesController,
    EvolucionTemporalController,
    ParticipantesCohorteController,
    VistaConductualController,
    VistasAgregadasController,
  ],
  providers: [
    AuditoriaService,
    ConsultarBitacoraUseCase,
    ConsultarCohortesUseCase,
    ConsultarEvolucionTemporalUseCase,
    ConsultarVistaAgregadaUseCase,
    ConsultarVistaConductualUseCase,
    ConsultarVistaNarrativaUseCase,
    ConsultarVistaNotificacionesUseCase,
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
      provide: VistasAgregadasRepository,
      useClass: PrismaVistasAgregadasRepository,
    },
    {
      provide: EvolucionSeguimientoPort,
      // Sustituir al conectar la consulta temporal de RF-78.
      useValue: {
        obtener: (id_cohorte: string) =>
          Promise.resolve({ id_cohorte, estado: 'NO_DISPONIBLE' }),
      } satisfies EvolucionSeguimientoPort,
    },
    {
      provide: SeguimientoAgregadoPort,
      // Reemplazar con el proveedor real cuando M05 publique RF-78.
      useValue: {
        obtener: (id: string) =>
          Promise.resolve(fuenteAgregadaNoDisponible(id)),
      } satisfies SeguimientoAgregadoPort,
    },
    {
      provide: NarrativaAgregadaPort,
      // Sustituir con el proveedor de M06 cuando se integre RF-117.
      useValue: {
        obtener: (id: string) =>
          Promise.resolve(fuenteAgregadaNoDisponible(id)),
      } satisfies NarrativaAgregadaPort,
    },
    {
      provide: NotificacionesAgregadasPort,
      // Sustituir con el proveedor de M07 cuando se integre RF-101.
      useValue: {
        obtener: (id: string) =>
          Promise.resolve(fuenteAgregadaNoDisponible(id)),
      } satisfies NotificacionesAgregadasPort,
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
