import type { Provider, Type } from '@nestjs/common';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { BitacoraController } from './controllers/bitacora.controller';
import { CohortesController } from './controllers/cohortes.controller';
import { ConfiguracionNotificacionesController } from './controllers/configuracion/configuracion-notificaciones.controller';
import { ConfiguracionUmbralesController } from './controllers/configuracion/configuracion-umbrales.controller';
import { DashboardPrincipalController } from './controllers/dashboard-principal.controller';
import { EvolucionTemporalController } from './controllers/evolucion-temporal.controller';
import { ExportacionCsvCohorteController } from './controllers/exportacion-csv-cohorte.controller';
import { GestionAlertasController } from './controllers/gestion-alertas/gestion-alertas.controller';
import { ParticipantesCohorteController } from './controllers/participantes-cohorte.controller';
import { PermisosIndividualesController } from './controllers/permisos-individuales/permisos-individuales.controller';
import { InteraccionNotificacionesController } from './controllers/seguimiento-individual/interaccion-notificaciones.controller';
import { ProgresionNarrativaController } from './controllers/seguimiento-individual/progresion-narrativa.controller';
import { SeguimientoIndividualController } from './controllers/seguimiento-individual/seguimiento-individual.controller';
import { VistaConductualController } from './controllers/vista-conductual.controller';
import { VistasAgregadasController } from './controllers/vistas-agregadas.controller';
import { AuditarAccesoExportacionCsvFilter } from './filters/auditar-acceso-exportacion-csv.filter';
import { AccesoBitacoraGuard } from './guards/acceso-bitacora.guard';
import { PermisoIndividualGuard } from './guards/permiso-individual.guard';
import { ConfiguracionSoloGlobalInterceptor } from './interceptors/configuracion-solo-global.interceptor';

/** Endpoints HTTP del módulo administrativo. */
export const AdministrativoPresentationControllers: Type[] = [
  BitacoraController,
  CohortesController,
  ConfiguracionUmbralesController,
  ConfiguracionNotificacionesController,
  DashboardPrincipalController,
  EvolucionTemporalController,
  ExportacionCsvCohorteController,
  GestionAlertasController,
  ParticipantesCohorteController,
  PermisosIndividualesController,
  SeguimientoIndividualController,
  ProgresionNarrativaController,
  InteraccionNotificacionesController,
  VistaConductualController,
  VistasAgregadasController,
];

/** Guards y filtros que los controladores resuelven por inyección. */
export const AdministrativoPresentationProviders: Provider[] = [
  AccesoBitacoraGuard,
  AuditarAccesoExportacionCsvFilter,
  ConfiguracionSoloGlobalInterceptor,
  PermisoIndividualGuard,
  RolesGuard,
];
