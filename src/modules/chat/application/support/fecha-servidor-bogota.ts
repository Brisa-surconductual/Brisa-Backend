const DESFASE_BOGOTA_MS = 5 * 60 * 60 * 1000;

/**
 * RF-43: fechas del reloj del servidor en ISO 8601 con el desfase de
 * America/Bogota (-05:00, sin horario de verano), al segundo.
 * Ej.: 2026-11-20T04:40:00-05:00.
 */
export function fechaServidorBogota(fecha: Date): string {
  return (
    new Date(fecha.getTime() - DESFASE_BOGOTA_MS).toISOString().slice(0, 19) +
    '-05:00'
  );
}
