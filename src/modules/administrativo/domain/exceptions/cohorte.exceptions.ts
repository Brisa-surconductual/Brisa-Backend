import type { EstadoCohorte } from '../enums/estado-cohorte.enum';
import { AdministrativoDomainException } from './domain.exception';

/** RF-124: la fecha de fin del programa es anterior a la de inicio. */
export class FechasCohorteInvalidasException extends AdministrativoDomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super(
      'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.',
      'FECHAS_COHORTE_INVALIDAS',
    );
  }
}

/** RF-124: el cambio de estado solicitado no sigue el ciclo de vida de la cohorte. */
export class TransicionCohorteInvalidaException extends AdministrativoDomainException {
  readonly tipo = 'CONFLICTO';

  constructor(actual: EstadoCohorte, destino: EstadoCohorte) {
    super(
      'La cohorte ya no está en un estado que permita esta acción.',
      'TRANSICION_COHORTE_INVALIDA',
      { estado_actual: actual, estado_destino: destino },
    );
  }
}
