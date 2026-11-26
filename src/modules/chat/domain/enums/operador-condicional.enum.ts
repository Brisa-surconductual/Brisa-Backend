/**
 * RF-25: operadores de la regla de una transición. SIEMPRE es la transición
 * por defecto ("cualquier otra respuesta"); CATEGORIA queda solo en el enum de BD.
 */
export enum OperadorCondicion {
  IGUALDAD = 'IGUALDAD',
  RANGO = 'RANGO',
  SIEMPRE = 'SIEMPRE',
}
