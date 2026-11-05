import { DomainException } from './domain.exception';

export class EstadoFlujoInvalidoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'El estado actual del flujo no permite esta operación.',
      'ESTADO_INVALIDO',
    );
  }
}

export class FlujoConversacionalNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El flujo conversacional no existe.');
  }
}

export class FlujoConversacionalNoEditableException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Solo se pueden modificar flujos conversacionales en estado BORRADOR.',
      'FLUJO_NO_EDITABLE',
    );
  }
}

export class FlujoPersonalizadoNoEncontradoException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('El árbol conversacional personalizado no existe.');
  }
}

export class PerfilClinicoArbolInvalidoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor() {
    super(
      'El árbol debe estar asociado a una combinación válida de perfil clínico antes de ser publicado.',
    );
  }
}

export class FlujoPersonalizadoArchivadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'No es posible publicar un árbol archivado directamente. Debe crearse una nueva versión en estado borrador.',
    );
  }
}

export class VersionPersonalizadaNoClonableException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Solo se puede crear una nueva versión desde un árbol publicado o archivado.',
    );
  }
}

export class FlujoPersonalizadoYaArchivadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('El árbol conversacional personalizado ya se encuentra archivado.');
  }
}

export class VersionPersonalizadaDuplicadaException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('Ya existe esa versión para la combinación de perfil clínico.');
  }
}

export class FlujoPersonalizadoPublicadoExistenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Ya existe un árbol personalizado publicado para esa combinación de perfil clínico.',
    );
  }
}

export class EliminacionArbolPersonalizadoProhibidaException extends DomainException {
  readonly tipo = 'PROHIBIDO';

  constructor() {
    super(
      'No es posible eliminar un árbol conversacional personalizado. Utilice la opción de archivado.',
    );
  }
}

export class FlujoGrupalPublicadoExistenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('Ya existe un flujo conversacional grupal publicado.');
  }
}
