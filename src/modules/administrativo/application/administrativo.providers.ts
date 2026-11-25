import type { Provider } from '@nestjs/common';
import { AuditoriaService } from './services/auditoria.service';
import { CompararCohortesUseCase } from './use-cases/comparar-cohortes.use-case';
import { ConsultarVistasFiltradasUseCase } from './use-cases/consultar-vistas-filtradas.use-case';
import { SeguimientoIndividualService } from './services/seguimiento-individual.service';
import { MarcarAlertaAtendidaUseCase } from './use-cases/gestion-alertas/marcar-alerta-atendida.use-case';
import { ConsultarHistorialAlertasUseCase } from './use-cases/seguimiento-individual/consultar-historial-alertas.use-case';
import { ConsultarInteraccionNotificacionesUseCase } from './use-cases/seguimiento-individual/consultar-interaccion-notificaciones.use-case';
import { ConsultarPerfilSeguimientoUseCase } from './use-cases/seguimiento-individual/consultar-perfil-seguimiento.use-case';
import { ConsultarProgresionNarrativaUseCase } from './use-cases/seguimiento-individual/consultar-progresion-narrativa.use-case';
import { ConsultarBitacoraUseCase } from './use-cases/consultar-bitacora.use-case';
import { ConsultarCohortesUseCase } from './use-cases/consultar-cohortes.use-case';
import { ConsultarDashboardPrincipalUseCase } from './use-cases/consultar-dashboard-principal.use-case';
import { ConsultarEvolucionTemporalUseCase } from './use-cases/consultar-evolucion-temporal.use-case';
import { ConsultarVistaAgregadaUseCase } from './use-cases/consultar-vista-agregada.use-case';
import { ConsultarVistaConductualUseCase } from './use-cases/consultar-vista-conductual.use-case';
import { ConsultarVistaNarrativaUseCase } from './use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from './use-cases/consultar-vista-notificaciones.use-case';
import { ExportarIndicadoresCohorteUseCase } from './use-cases/exportar-indicadores-cohorte.use-case';
import { GestionarContenidoNarrativoUseCase } from './use-cases/gestionar-contenido-narrativo.use-case';
import { GestionarMensajesNotificacionUseCase } from './use-cases/gestionar-mensajes-notificacion.use-case';
import { GestionarCohortesUseCase } from './use-cases/gestionar-cohortes.use-case';
import { GestionarParticipantesCohorteUseCase } from './use-cases/gestionar-participantes-cohorte.use-case';
import { ListarPermisosIndividualesUseCase } from './use-cases/permisos-individuales/listar-permisos-individuales.use-case';
import { OtorgarPermisoIndividualUseCase } from './use-cases/permisos-individuales/otorgar-permiso-individual.use-case';
import { RevocarPermisoIndividualUseCase } from './use-cases/permisos-individuales/revocar-permiso-individual.use-case';
import { VerificarPermisoIndividualUseCase } from './use-cases/permisos-individuales/verificar-permiso-individual.use-case';

export const AdministrativoApplicationProviders: Provider[] = [
  AuditoriaService,
  CompararCohortesUseCase,
  ConsultarVistasFiltradasUseCase,
  SeguimientoIndividualService,
  MarcarAlertaAtendidaUseCase,
  ConsultarHistorialAlertasUseCase,
  ConsultarPerfilSeguimientoUseCase,
  ConsultarProgresionNarrativaUseCase,
  ConsultarInteraccionNotificacionesUseCase,
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
  GestionarContenidoNarrativoUseCase,
  GestionarMensajesNotificacionUseCase,
  GestionarParticipantesCohorteUseCase,
  ListarPermisosIndividualesUseCase,
  OtorgarPermisoIndividualUseCase,
  RevocarPermisoIndividualUseCase,
  VerificarPermisoIndividualUseCase,
];
