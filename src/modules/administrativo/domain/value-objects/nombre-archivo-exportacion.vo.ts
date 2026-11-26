const FECHA_ARCHIVO = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha calendario de Colombia en formato YYYYMMDD. */
function fechaArchivo(fecha: Date): string {
  const partes = Object.fromEntries(
    FECHA_ARCHIVO.formatToParts(fecha).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}${partes.month}${partes.day}`;
}

/** Nombre del CSV de cohorte con la fecha calendario de Colombia (RF-144). */
export function nombreArchivoCohorte(fecha = new Date()): string {
  return `indicadores_cohorte_activa_${fechaArchivo(fecha)}.csv`;
}

/**
 * Nombre del CSV individual (RF-145) con la fecha calendario de Colombia. No
 * incluye el seudónimo: el archivo no debe identificar al participante.
 */
export function nombreArchivoIndividual(fecha = new Date()): string {
  return `seguimiento_individual_${fechaArchivo(fecha)}.csv`;
}
