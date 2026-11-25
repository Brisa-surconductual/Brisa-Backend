import type { Provider } from '@nestjs/common';
import { AuditoriaService } from './services/auditoria.service';
import { ConsultarBitacoraUseCase } from './use-cases/consultar-bitacora.use-case';
import { ConsultarCohortesUseCase } from './use-cases/consultar-cohortes.use-case';
import { ConsultarDashboardPrincipalUseCase } from './use-cases/consultar-dashboard-principal.use-case';
import { ConsultarEvolucionTemporalUseCase } from './use-cases/consultar-evolucion-temporal.use-case';
import { ConsultarVistaAgregadaUseCase } from './use-cases/consultar-vista-agregada.use-case';
import { ConsultarVistaConductualUseCase } from './use-cases/consultar-vista-conductual.use-case';
import { ConsultarVistaNarrativaUseCase } from './use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from './use-cases/consultar-vista-notificaciones.use-case';
import { ExportarIndicadoresCohorteUseCase } from './use-cases/exportar-indicadores-cohorte.use-case';
import { GestionarCohortesUseCase } from './use-cases/gestionar-cohortes.use-case';
import { GestionarParticipantesCohorteUseCase } from './use-cases/gestionar-participantes-cohorte.use-case';

export const AdministrativoApplicationProviders: Provider[] = [
  AuditoriaService,
  ConsultarBitacoraUseCase,
  ConsultarCohortesUseCase,
  ConsultarDashboardPrincipalUseCase,
  ConsultarEvolucionTemporalUseCase,
  ConsultarVistaAgregadaUseCase,
  ConsultarVistaConductualUseCase,
  ConsultarVistaNarrativaUseCase,
  ConsultarVistaNotificacionesUseCase,
  ExportarIndicadoresCohorteUseCase,
  GestionarCohortesUseCase,
  GestionarParticipantesCohorteUseCase,
];
