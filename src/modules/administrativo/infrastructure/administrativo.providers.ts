import type { Provider } from '@nestjs/common';
import { GestionContenidoInfrastructureProviders } from './gestion-contenido.providers';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from '../application/ports/auditoria.port';
import { EvolucionSeguimientoPort } from '../application/ports/evolucion-seguimiento.port';
import { fuenteAgregadaNoDisponible } from '../application/ports/fuente-vista-agregada.port';
import { NarrativaAgregadaPort } from '../application/ports/narrativa-agregada.port';
import { NarrativaIndividualPort } from '../application/ports/narrativa-individual.port';
import { NotificacionesAgregadasPort } from '../application/ports/notificaciones-agregadas.port';
import { NotificacionesIndividualPort } from '../application/ports/notificaciones-individual.port';
import { ParametrosNotificacionPort } from '../application/ports/parametros-notificacion.port';
import { SeguimientoAgregadoPort } from '../application/ports/seguimiento-agregado.port';
import { SeguimientoIndividualPort } from '../application/ports/seguimiento-individual.port';
import { UmbralesSeguimientoPort } from '../application/ports/umbrales-seguimiento.port';
import { EstadoFuenteAgregada } from '../domain/enums/estado-fuente-agregada.enum';
import { CohortesRepository } from '../domain/repositories/cohortes.repository';
import { ParticipantesCohorteRepository } from '../domain/repositories/participantes-cohorte.repository';
import { AlertasGestionRepository } from '../domain/repositories/alertas-gestion.repository';
import { PermisosIndividualesRepository } from '../domain/repositories/permisos-individuales.repository';
import { SeguimientoIndividualRepository } from '../domain/repositories/seguimiento-individual.repository';
import { VistasAgregadasRepository } from '../domain/repositories/vistas-agregadas.repository';
import { BullMqAuditoriaAdapter } from './messaging/bullmq-auditoria.adapter';
import { MockNarrativaIndividualAdapter } from './narrativa/mock-narrativa-individual.adapter';
import { MockNotificacionesIndividualAdapter } from './notificaciones/mock-notificaciones-individual.adapter';
import { MockParametrosNotificacionAdapter } from './notificaciones/mock-parametros-notificacion.adapter';
import { PrismaAlertasGestionRepository } from './persistence/prisma-alertas-gestion.repository';
import { PrismaBitacoraRepository } from './persistence/prisma-bitacora.repository';
import { PrismaCohortesRepository } from './persistence/prisma-cohortes.repository';
import { PrismaParticipantesCohorteRepository } from './persistence/prisma-participantes-cohorte.repository';
import { PrismaPermisosIndividualesRepository } from './persistence/prisma-permisos-individuales.repository';
import { PrismaSeguimientoIndividualRepository } from './persistence/prisma-seguimiento-individual.repository';
import { PrismaVistasAgregadasRepository } from './persistence/prisma-vistas-agregadas.repository';
import { MockSeguimientoIndividualAdapter } from './seguimiento/mock-seguimiento-individual.adapter';
import { MockUmbralesSeguimientoAdapter } from './seguimiento/mock-umbrales-seguimiento.adapter';

/** Liga los puertos de dominio y aplicación con sus implementaciones concretas. */
export const AdministrativoInfrastructureProviders: Provider[] = [
  ...GestionContenidoInfrastructureProviders,
  { provide: BitacoraRepository, useClass: PrismaBitacoraRepository },
  { provide: CohortesRepository, useClass: PrismaCohortesRepository },
  {
    provide: ParticipantesCohorteRepository,
    useClass: PrismaParticipantesCohorteRepository,
  },
  {
    provide: PermisosIndividualesRepository,
    useClass: PrismaPermisosIndividualesRepository,
  },
  {
    provide: AlertasGestionRepository,
    useClass: PrismaAlertasGestionRepository,
  },
  {
    provide: SeguimientoIndividualRepository,
    useClass: PrismaSeguimientoIndividualRepository,
  },
  {
    provide: SeguimientoIndividualPort,
    // Reemplazar por el adaptador real cuando M05 publique RF-77 / RF-63 / RF-68.
    useClass: MockSeguimientoIndividualAdapter,
  },
  {
    provide: NarrativaIndividualPort,
    // Reemplazar por el adaptador real cuando M06 publique RF-116.
    useClass: MockNarrativaIndividualAdapter,
  },
  {
    provide: NotificacionesIndividualPort,
    // Reemplazar por el adaptador real cuando M07 publique RF-98 / RF-100.
    useClass: MockNotificacionesIndividualAdapter,
  },
  {
    provide: UmbralesSeguimientoPort,
    // Reemplazar por el adaptador real cuando M05 publique RF-79.
    useClass: MockUmbralesSeguimientoAdapter,
  },
  {
    provide: ParametrosNotificacionPort,
    // Reemplazar por el adaptador real cuando M07 publique RF-87 / RF-88 / RF-89.
    useClass: MockParametrosNotificacionAdapter,
  },
  {
    provide: VistasAgregadasRepository,
    useClass: PrismaVistasAgregadasRepository,
  },
  { provide: ColaAuditoriaPort, useClass: BullMqAuditoriaAdapter },
  {
    provide: EvolucionSeguimientoPort,
    // Sustituir al conectar la consulta temporal de RF-78.
    useValue: {
      obtener: (id_cohorte: string) =>
        Promise.resolve({
          id_cohorte,
          estado: EstadoFuenteAgregada.NO_DISPONIBLE,
        }),
    } satisfies EvolucionSeguimientoPort,
  },
  {
    provide: SeguimientoAgregadoPort,
    // Reemplazar con el proveedor real cuando M05 publique RF-78.
    useValue: {
      obtener: (id: string) => Promise.resolve(fuenteAgregadaNoDisponible(id)),
    } satisfies SeguimientoAgregadoPort,
  },
  {
    provide: NarrativaAgregadaPort,
    // Sustituir con el proveedor de M06 cuando se integre RF-117.
    useValue: {
      obtener: (id: string) => Promise.resolve(fuenteAgregadaNoDisponible(id)),
    } satisfies NarrativaAgregadaPort,
  },
  {
    provide: NotificacionesAgregadasPort,
    // Sustituir con el proveedor de M07 cuando se integre RF-101.
    useValue: {
      obtener: (id: string) => Promise.resolve(fuenteAgregadaNoDisponible(id)),
    } satisfies NotificacionesAgregadasPort,
  },
];
