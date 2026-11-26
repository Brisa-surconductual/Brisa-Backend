import type { EstadoDashboard } from '../enums/estado-dashboard.enum';
import type { DatosConductuales } from '../entities/vistas-agregadas/vista-conductual.entity';
import type { DatosNarrativos } from '../entities/vistas-agregadas/vista-narrativa.entity';
import type { DatosNotificaciones } from '../entities/vistas-agregadas/vista-notificaciones.entity';
import type { VistaAgregada } from './vista-agregada';

/** Las tres vistas agregadas que componen el panel principal (RF-140). */
export interface VistasDashboard {
  vista_conductual: VistaAgregada<DatosConductuales>;
  vista_narrativa: VistaAgregada<DatosNarrativos>;
  vista_notificaciones: VistaAgregada<DatosNotificaciones>;
}

type VistasVacias = { [Vista in keyof VistasDashboard]: null };

/** Panel principal administrativo de la cohorte activa (RF-140). */
export type DashboardPrincipal = (VistasDashboard | VistasVacias) & {
  id_cohorte: string | null;
  estado: EstadoDashboard;
  total_alertas_criticas_pendientes: number | null;
  fecha_carga_pantalla: string;
  advertencias: string[];
  mensaje: string | null;
};
