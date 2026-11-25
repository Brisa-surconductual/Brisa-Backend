import type { Provider, Type } from '@nestjs/common';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { BitacoraController } from './controllers/bitacora.controller';
import { ContenidoNarrativoController } from './controllers/contenido-narrativo.controller';
import { MensajesNotificacionController } from './controllers/mensajes-notificacion.controller';
import { CohortesController } from './controllers/cohortes.controller';
import { DashboardPrincipalController } from './controllers/dashboard-principal.controller';
import { EvolucionTemporalController } from './controllers/evolucion-temporal.controller';
import { ExportacionCsvCohorteController } from './controllers/exportacion-csv-cohorte.controller';
import { ParticipantesCohorteController } from './controllers/participantes-cohorte.controller';
import { PermisosIndividualesController } from './controllers/permisos-individuales/permisos-individuales.controller';
import { VistaConductualController } from './controllers/vista-conductual.controller';
import { VistasAgregadasController } from './controllers/vistas-agregadas.controller';
import { AuditarAccesoExportacionCsvFilter } from './filters/auditar-acceso-exportacion-csv.filter';
import { AccesoBitacoraGuard } from './guards/acceso-bitacora.guard';
import { PermisoIndividualGuard } from './guards/permiso-individual.guard';

/** Endpoints HTTP del módulo administrativo. */
export const AdministrativoPresentationControllers: Type[] = [
  BitacoraController,
  CohortesController,
  ContenidoNarrativoController,
  MensajesNotificacionController,
  DashboardPrincipalController,
  EvolucionTemporalController,
  ExportacionCsvCohorteController,
  ParticipantesCohorteController,
  PermisosIndividualesController,
  VistaConductualController,
  VistasAgregadasController,
];

/** Guards y filtros que los controladores resuelven por inyección. */
export const AdministrativoPresentationProviders: Provider[] = [
  AccesoBitacoraGuard,
  AuditarAccesoExportacionCsvFilter,
  PermisoIndividualGuard,
  RolesGuard,
];
