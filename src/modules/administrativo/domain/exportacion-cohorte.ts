import type { AccionAuditable } from './auditoria';
import type { NIVELES_PROGRESO } from './niveles-progreso';
import type { DatosVistaAgregada, VistaAgregada } from './vista-agregada';
import type { DatosConductuales } from './vista-conductual';
import type { DatosNotificaciones } from './vista-notificaciones';

export const COLUMNAS_EXPORTACION_COHORTE = [
  'nombre_cohorte',
  'estado_vista_conductual',
  'fecha_actualizacion_conductual',
  'total_usuarios_activos',
  'usuarios_nivel_inicial',
  'usuarios_nivel_en_avance',
  'usuarios_nivel_avanzado',
  'usuarios_nivel_completado',
  'tasa_adherencia_promedio',
  'alertas_inactividad_pendientes',
  'alertas_craving_pendientes',
  'estado_vista_notificaciones',
  'fecha_actualizacion_notificaciones',
  'tasa_apertura_promedio',
  'tasa_conversion_promedio',
  'total_notificaciones_enviadas',
  'total_notificaciones_entregadas',
  'total_notificaciones_descartadas',
] as const;

const SIN_DATO = 'No disponible';
const FECHA_ARCHIVO = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

type Celda = string | number;
type FilaExportacion = Record<
  (typeof COLUMNAS_EXPORTACION_COHORTE)[number],
  Celda
>;
export type VistaConductualExportable = VistaAgregada<DatosConductuales> & {
  datos: DatosConductuales;
};

export function accionExportacionCohorte(
  idCohorte: string | null,
): AccionAuditable {
  return {
    accion: 'EXPORTACION_DATOS',
    recurso: 'EXPORTACION_CSV_COHORTE',
    idRecurso: idCohorte,
    detalle: { nombre_archivo: null, tamano_bytes: null },
  };
}

export function nombreArchivoCohorte(fecha = new Date()): string {
  const partes = Object.fromEntries(
    FECHA_ARCHIVO.formatToParts(fecha).map(({ type, value }) => [type, value]),
  );
  return `indicadores_cohorte_activa_${partes.year}${partes.month}${partes.day}.csv`;
}

function estadoVista(vista: VistaAgregada<DatosVistaAgregada> | null): string {
  return vista?.datos ? vista.estado : 'NO_DISPONIBLE';
}

function campoCsv(valor: Celda): string {
  if (typeof valor === 'number') return String(valor);

  const inicial = valor[0];
  const significativo = valor.trimStart()[0];
  const requiereProteccion =
    (inicial && '\t\r\n'.includes(inicial)) ||
    (significativo && '=+-@'.includes(significativo));
  const texto = requiereProteccion ? "'" + valor : valor;
  return requiereProteccion || /[",\r\n]/u.test(texto)
    ? '"' + texto.replaceAll('"', '""') + '"'
    : texto;
}

export function generarCsvCohorte(
  nombreCohorte: string,
  conductual: VistaConductualExportable,
  notificaciones: VistaAgregada<DatosNotificaciones> | null,
): string {
  const b = conductual.datos;
  const n = notificaciones?.datos;
  const porNivel = (nivel: (typeof NIVELES_PROGRESO)[number]) =>
    b.distribucion_niveles_progreso?.find((fila) => fila.nivel === nivel)
      ?.total_usuarios ?? SIN_DATO;

  const fila: FilaExportacion = {
    nombre_cohorte: nombreCohorte,
    estado_vista_conductual: estadoVista(conductual),
    fecha_actualizacion_conductual: b.fecha_actualizacion,
    total_usuarios_activos: b.total_usuarios_activos ?? SIN_DATO,
    usuarios_nivel_inicial: porNivel('INICIAL'),
    usuarios_nivel_en_avance: porNivel('EN_AVANCE'),
    usuarios_nivel_avanzado: porNivel('AVANZADO'),
    usuarios_nivel_completado: porNivel('COMPLETADO'),
    tasa_adherencia_promedio: b.tasa_adherencia_promedio ?? SIN_DATO,
    alertas_inactividad_pendientes:
      b.alertas_inactividad_pendientes ?? SIN_DATO,
    alertas_craving_pendientes: b.alertas_craving_pendientes ?? SIN_DATO,
    estado_vista_notificaciones: estadoVista(notificaciones),
    fecha_actualizacion_notificaciones: n?.fecha_actualizacion ?? SIN_DATO,
    tasa_apertura_promedio: n?.tasa_apertura_promedio ?? SIN_DATO,
    tasa_conversion_promedio: n?.tasa_conversion_promedio ?? SIN_DATO,
    total_notificaciones_enviadas: n?.total_notificaciones_enviadas ?? SIN_DATO,
    total_notificaciones_entregadas:
      n?.total_notificaciones_entregadas ?? SIN_DATO,
    total_notificaciones_descartadas:
      n?.total_notificaciones_descartadas ?? SIN_DATO,
  };

  const valores = COLUMNAS_EXPORTACION_COHORTE.map((columna) =>
    campoCsv(fila[columna]),
  );
  return (
    '\uFEFF' +
    COLUMNAS_EXPORTACION_COHORTE.join(',') +
    '\r\n' +
    valores.join(',') +
    '\r\n'
  );
}
