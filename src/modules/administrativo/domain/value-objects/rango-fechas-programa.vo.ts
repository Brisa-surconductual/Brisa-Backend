/**
 * El programa de una cohorte no puede terminar antes de empezar (RF-124).
 * Las fechas llegan como `YYYY-MM-DD`, por lo que la comparación léxica es
 * equivalente a la cronológica.
 */
export function esRangoFechasProgramaValido(
  fechaInicio: string,
  fechaFin: string,
): boolean {
  return fechaFin >= fechaInicio;
}
