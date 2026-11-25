import { HttpException } from '@nestjs/common';

const ERRORES_EXPORTACION_CSV = {
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

export type CodigoErrorExportacionCsv = keyof typeof ERRORES_EXPORTACION_CSV;

/** Errores de la exportación CSV agregada de la cohorte (RF-144). */
export class ExportacionCsvException extends HttpException {
  constructor(codigo: CodigoErrorExportacionCsv, cause?: unknown) {
    const [statusCode, mensaje] = ERRORES_EXPORTACION_CSV[codigo];
    super({ statusCode, codigo, mensaje }, statusCode, { cause });
  }
}
