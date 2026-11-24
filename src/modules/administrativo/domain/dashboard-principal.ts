import type { VistaAgregada } from './vista-agregada';
import type { DatosConductuales } from './vista-conductual';
import type { DatosNarrativos } from './vista-narrativa';
import type { DatosNotificaciones } from './vista-notificaciones';

interface VistasDashboard {
  vista_conductual: VistaAgregada<DatosConductuales>;
  vista_narrativa: VistaAgregada<DatosNarrativos>;
  vista_notificaciones: VistaAgregada<DatosNotificaciones>;
}

type VistasVacias = { [Vista in keyof VistasDashboard]: null };

export type DashboardPrincipal = (VistasDashboard | VistasVacias) & {
  id_cohorte: string | null;
  estado:
    | 'DISPONIBLE'
    | 'PARCIAL'
    | 'DESACTUALIZADO'
    | 'NO_DISPONIBLE'
    | 'SIN_COHORTE_ACTIVA';
  total_alertas_criticas_pendientes: number | null;
  fecha_carga_pantalla: string;
  advertencias: string[];
  mensaje: string | null;
};

const DIMENSIONES: Record<keyof VistasDashboard, string> = {
  vista_conductual: 'indicadores conductuales',
  vista_narrativa: 'progresión narrativa',
  vista_notificaciones: 'efectividad de notificaciones',
};

const MENSAJE_FALLO_TOTAL =
  'El panel principal no está disponible en este momento porque ninguna de las fuentes de información pudo ser consultada. Intente nuevamente más tarde.';

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

export function ensamblarDashboard(
  idCohorte: string,
  vistas: VistasDashboard,
): DashboardPrincipal {
  const entradas = Object.keys(DIMENSIONES) as (keyof VistasDashboard)[];
  const fallidas = entradas.filter(
    (clave) => vistas[clave].estado_agregacion === 'ERROR_ACTUALIZACION',
  );
  const falloTotal = fallidas.length === entradas.length;
  const tieneRespaldo = Object.values(vistas).some(
    ({ estado }) => estado === 'DESACTUALIZADA',
  );
  let estado: DashboardPrincipal['estado'] = 'DISPONIBLE';
  if (falloTotal) estado = tieneRespaldo ? 'DESACTUALIZADO' : 'NO_DISPONIBLE';
  else if (fallidas.length > 0) estado = 'PARCIAL';

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

export function dashboardSinCohorte(): DashboardPrincipal {
  return {
    id_cohorte: null,
    estado: 'SIN_COHORTE_ACTIVA',
    vista_conductual: null,
    vista_narrativa: null,
    vista_notificaciones: null,
    total_alertas_criticas_pendientes: null,
    fecha_carga_pantalla: new Date().toISOString(),
    advertencias: [],
    mensaje:
      'No existe una cohorte activa en este momento. Cree o active una cohorte para comenzar a visualizar el panel principal.',
  };
}
