import { EstadoAgregacion } from '../../enums/estado-agregacion.enum';
import { EstadoDashboard } from '../../enums/estado-dashboard.enum';
import { EstadoVistaAgregada } from '../../enums/estado-vista-agregada.enum';
import type {
  DashboardPrincipal,
  VistasDashboard,
} from '../../results/dashboard-principal';
import type { DatosConductuales } from '../vistas-agregadas/vista-conductual.entity';

const DIMENSIONES: Record<keyof VistasDashboard, string> = {
  vista_conductual: 'indicadores conductuales',
  vista_narrativa: 'progresión narrativa',
  vista_notificaciones: 'efectividad de notificaciones',
};

const MENSAJE_FALLO_TOTAL =
  'El panel principal no está disponible en este momento porque ninguna de las fuentes de información pudo ser consultada. Intente nuevamente más tarde.';

const MENSAJE_SIN_COHORTE =
  'No existe una cohorte activa en este momento. Cree o active una cohorte para comenzar a visualizar el panel principal.';

function totalAlertas(datos: DatosConductuales | null): number | null {
  if (!datos) return null;
  const { alertas_inactividad_pendientes, alertas_craving_pendientes } = datos;
  if (
    alertas_inactividad_pendientes === null ||
    alertas_craving_pendientes === null
  )
    return null;

  const total = alertas_inactividad_pendientes + alertas_craving_pendientes;
  return Number.isSafeInteger(total) ? total : null;
}

/** Ensambla el panel aislando el fallo de cada vista (RF-140). */
export function ensamblarDashboard(
  idCohorte: string,
  vistas: VistasDashboard,
): DashboardPrincipal {
  const entradas = Object.keys(DIMENSIONES) as (keyof VistasDashboard)[];
  const fallidas = entradas.filter(
    (clave) =>
      vistas[clave].estado_agregacion === EstadoAgregacion.ERROR_ACTUALIZACION,
  );
  const falloTotal = fallidas.length === entradas.length;
  const tieneRespaldo = Object.values(vistas).some(
    ({ estado }) => estado === EstadoVistaAgregada.DESACTUALIZADA,
  );
  let estado: EstadoDashboard = EstadoDashboard.DISPONIBLE;
  if (falloTotal)
    estado = tieneRespaldo
      ? EstadoDashboard.DESACTUALIZADO
      : EstadoDashboard.NO_DISPONIBLE;
  else if (fallidas.length > 0) estado = EstadoDashboard.PARCIAL;

  return {
    ...vistas,
    id_cohorte: idCohorte,
    estado,
    total_alertas_criticas_pendientes: totalAlertas(
      vistas.vista_conductual.datos,
    ),
    fecha_carga_pantalla: new Date().toISOString(),
    advertencias: falloTotal
      ? []
      : fallidas.map(
          (clave) =>
            `La vista de ${DIMENSIONES[clave]} no está disponible en este momento. Se muestra el panorama con la información restante disponible.`,
        ),
    mensaje: falloTotal ? MENSAJE_FALLO_TOTAL : null,
  };
}

/** Panel vacío cuando no existe una cohorte activa (RF-140). */
export function dashboardSinCohorte(): DashboardPrincipal {
  return {
    id_cohorte: null,
    estado: EstadoDashboard.SIN_COHORTE_ACTIVA,
    vista_conductual: null,
    vista_narrativa: null,
    vista_notificaciones: null,
    total_alertas_criticas_pendientes: null,
    fecha_carga_pantalla: new Date().toISOString(),
    advertencias: [],
    mensaje: MENSAJE_SIN_COHORTE,
  };
}
