import { AdministrativoDomainException } from './domain.exception';

/** RF-147: la alerta ya fue atendida o resuelta y no admite otro cambio. */
export class AlertaYaAtendidaException extends AdministrativoDomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La alerta ya se encuentra registrada como atendida y no puede ser modificada.',
      'ALERTA_YA_ATENDIDA',
    );
  }
}

/** RF-147: solo se atiende una alerta ACTIVA o PENDIENTE. */
export class AlertaNoActivaException extends AdministrativoDomainException {
  readonly tipo = 'CONFLICTO';

  constructor(estado: string) {
    super(
      'La alerta no se encuentra activa y no puede marcarse como atendida.',
      'ALERTA_NO_ACTIVA',
      { estado_resolucion: estado },
    );
  }
}

/** RF-147: el cambio de estado de una alerta exige un motivo válido. */
export class MotivoAtencionInvalidoException extends AdministrativoDomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El motivo es obligatorio y debe tener entre 10 y 500 caracteres.',
      'MOTIVO_INVALIDO',
    );
  }
}
