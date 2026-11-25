import { AdministrativoDomainException } from './domain.exception';

/** RF-04: nadie puede concederse un permiso individual a sí mismo. */
export class AutoconcesionNoPermitidaException extends AdministrativoDomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'No puede concederse permisos a sí mismo.',
      'AUTOCONCESION_NO_PERMITIDA',
    );
  }
}

/** RF-04: la vigencia del permiso debe terminar en el futuro. */
export class VigenciaPermisoInvalidaException extends AdministrativoDomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'La fecha de fin de vigencia debe ser posterior al momento actual.',
      'VIGENCIA_INVALIDA',
    );
  }
}

/** RF-04: un permiso revocado no se puede volver a revocar. */
export class PermisoYaRevocadoException extends AdministrativoDomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('El permiso ya fue revocado.', 'PERMISO_YA_REVOCADO');
  }
}
