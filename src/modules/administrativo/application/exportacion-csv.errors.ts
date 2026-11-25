import { HttpException } from '@nestjs/common';

const ERRORES_CSV = {
  ACCESO_DENEGADO: [
    403,
    'Acceso denegado. No cuenta con los privilegios necesarios para exportar datos del módulo administrativo.',
  ],
  COHORTE_NO_ACTIVA: [
    422,
    'No se puede exportar. La cohorte seleccionada no está activa o no existe en el sistema.',
  ],
  SIN_INDICADORES_CONSOLIDADOS: [
    422,
    'La cohorte activa no contiene datos de indicadores para exportar. Por favor, espere a que el sistema procese los datos.',
  ],
  ERROR_GENERACION_CSV: [
    500,
    'Ocurrió un error al generar el archivo CSV. Por favor, intente nuevamente o contacte a soporte.',
  ],
} as const;

export function errorExportacionCsv(
  codigo: keyof typeof ERRORES_CSV,
  cause?: unknown,
) {
  const [status, mensaje] = ERRORES_CSV[codigo];
  return new HttpException({ statusCode: status, codigo, mensaje }, status, {
    cause,
  });
}
