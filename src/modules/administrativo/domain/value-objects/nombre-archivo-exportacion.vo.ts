const FECHA_ARCHIVO = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Nombre del CSV de cohorte con la fecha calendario de Colombia (RF-144). */
export function nombreArchivoCohorte(fecha = new Date()): string {
  const partes = Object.fromEntries(
    FECHA_ARCHIVO.formatToParts(fecha).map(({ type, value }) => [type, value]),
  );
  return `indicadores_cohorte_activa_${partes.year}${partes.month}${partes.day}.csv`;
}
