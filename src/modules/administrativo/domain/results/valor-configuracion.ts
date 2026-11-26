/**
 * Valor de una configuración global de M05 o M07 (RF-136, RF-137): un número,
 * un objeto o una lista, tal como lo define el módulo dueño. M-8 no interpreta
 * su forma; solo lo compara, lo muestra y lo audita.
 */
export type ValorConfiguracion =
  | string
  | number
  | boolean
  | null
  | ValorConfiguracion[]
  | { [clave: string]: ValorConfiguracion };
