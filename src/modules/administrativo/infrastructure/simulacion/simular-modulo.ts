/**
 * Utilidades de los adaptadores mock de módulos que aún no existen (M05, M06,
 * M07). Las variables de entorno se leen en cada llamada, para poder cambiar el
 * escenario simulado sin reiniciar la aplicación ni las pruebas.
 */

const RETARDO_POR_OMISION_MS = 150;

/** ¿La variable de entorno vale `true` (sin distinguir mayúsculas)? */
export function flagActivo(variable: string): boolean {
  return process.env[variable]?.toLowerCase() === 'true';
}

export interface SimulacionLlamada {
  /** Variable con el retardo de red en ms (por omisión 150 ms). */
  variableRetardo: string;
  /** Variable que, en `true`, hace fallar la llamada (módulo caído). */
  variableCaido: string;
  /** Nombre del módulo para el mensaje de error, p. ej. `M06`. */
  modulo: string;
}

/** Simula la latencia de red y, si está activado, que el módulo no responde. */
export async function simularLlamada({
  variableRetardo,
  variableCaido,
  modulo,
}: SimulacionLlamada): Promise<void> {
  const configurado = Number(process.env[variableRetardo]);
  const retardo =
    Number.isFinite(configurado) && configurado >= 0
      ? configurado
      : RETARDO_POR_OMISION_MS;
  if (retardo > 0) await new Promise((resolve) => setTimeout(resolve, retardo));
  if (flagActivo(variableCaido))
    throw new Error(`${modulo} no disponible (simulado).`);
}
