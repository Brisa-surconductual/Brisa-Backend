import { DomainException } from './domain.exception';

export class ConteoElegibilidadInvalidoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super('Los conteos de perfiles activos son invalidos.');
  }
}

export class AsignacionNoVigenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La asignación de modalidad ya no se encuentra vigente.',
      'ASIGNACION_NO_VIGENTE',
    );
  }
}

export class SinAsignacionesVigentesException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El programa no tiene asignaciones de modalidad vigentes.',
      'SIN_ASIGNACIONES_VIGENTES',
    );
  }
}

export class ModalidadNoGrupalException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'La transición solo aplica cuando todos los participantes están en modalidad grupal.',
      'MODALIDAD_NO_GRUPAL',
    );
  }
}

export class SinParticipantesActivosException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El programa no tiene participantes activos.',
      'SIN_PARTICIPANTES_ACTIVOS',
    );
  }
}

export class PerfilesIncompletosException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor(sinPerfilCompleto: number) {
    super(
      'Existen participantes activos sin perfil clínico completo.',
      'PERFILES_INCOMPLETOS',
      { sin_perfil_completo: sinPerfilCompleto },
    );
  }
}

export class TransicionConcurrenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Las asignaciones cambiaron durante la transición. Intente nuevamente.',
      'TRANSICION_CONCURRENTE',
    );
  }
}
