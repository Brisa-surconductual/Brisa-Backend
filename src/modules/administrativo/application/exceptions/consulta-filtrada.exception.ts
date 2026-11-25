import { HttpException } from '@nestjs/common';

const errores = {
  RANGO_FECHAS_INVALIDO: [
    400,
    'El rango de fechas seleccionado no es válido. Verifique que la fecha de inicio sea anterior a la fecha de fin.',
  ],
  FILTRO_MODALIDAD_INVALIDO: [
    400,
    'La modalidad terapéutica seleccionada no es válida.',
  ],
  VISTA_OBJETIVO_INVALIDA: [
    400,
    'La vista objetivo seleccionada no es válida.',
  ],
  UNIDAD_TEMPORAL_NO_ENCONTRADA: [
    404,
    'La unidad temporal seleccionada no existe en el cronograma del programa.',
  ],
  COHORTES_INSUFICIENTES: [
    400,
    'Debe seleccionar al menos dos cohortes para poder realizar una comparación de indicadores.',
  ],
  LIMITE_COHORTES_EXCEDIDO: [
    400,
    'Puede comparar un máximo de cinco cohortes.',
  ],
  COHORTES_INVALIDAS: [
    400,
    'Los identificadores de las cohortes no son válidos.',
  ],
  COHORTE_NO_ENCONTRADA: [404, 'Una de las cohortes seleccionadas no existe.'],
  INDICADORES_INVALIDOS: [
    400,
    'Seleccione indicadores de progreso o adherencia.',
  ],
  COHORTES_SIN_INDICADORES: [
    422,
    'Las cohortes seleccionadas aún no tienen indicadores calculados.',
  ],
  ERROR_CONSULTA_FILTRADA: [
    500,
    'No fue posible aplicar el filtro seleccionado en este momento. Intente nuevamente más tarde.',
  ],
} as const;

export class ConsultaFiltradaException extends HttpException {
  constructor(codigo: keyof typeof errores) {
    const [status, mensaje] = errores[codigo];
    super({ status, codigo, mensaje }, status);
  }
}
