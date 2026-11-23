import type { DiagnosticoCapturaPerfil } from '../results/diagnostico-captura-perfil';
import type { DiagnosticoRestriccionesSos } from '../results/diagnostico-restricciones-sos';
import type { DimensionPerfilClinico } from '../enums/perfil-clinico.enum';
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

/** RF-43: versión SOS ocupada (índice `uq_flujo_version_sos`). */
export class VersionSosDuplicadaException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('Ya existe esa versión del flujo SOS.');
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

/**
 * GRUPAL y SOS admiten un único flujo publicado (RF-25 / RF-43). Para GRUPAL
 * conserva el mensaje histórico.
 */
export class FlujoPublicadoUnicoExistenteException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor(modalidad: 'GRUPAL' | 'SOS' = 'GRUPAL') {
    super(
      modalidad === 'SOS'
        ? 'Ya existe un flujo conversacional SOS publicado.'
        : 'Ya existe un flujo conversacional grupal publicado.',
    );
  }
}

/**
 * RF-43: el flujo SOS es de nodos fijos e independiente del cronograma y del
 * perfil clínico.
 */
export class FlujoSosInvalidoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(readonly detalles: DiagnosticoRestriccionesSos) {
    super(
      'El flujo SOS no puede capturar perfil clínico ni ligar nodos a contenido del cronograma.',
      'FLUJO_SOS_INVALIDO',
      detalles,
    );
  }
}

/** RF-43: la creación genérica no admite SOS; tiene su propia ruta. */
export class ModalidadSosRutaPropiaException extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA';

  constructor() {
    super(
      'Los flujos SOS se crean con POST /chat/admin/flujos-sos.',
      'MODALIDAD_SOS_RUTA_PROPIA',
    );
  }
}

/** RF-25 (trasladado desde RF-27B): el árbol grupal debe tener exactamente
 * un nodo de captura por dimensión del perfil clínico antes de publicarse. */
export class NodoCapturaPerfilInvalidoException extends DomainException {
  readonly tipo = 'NO_PROCESABLE';

  constructor(
    readonly detalles: DiagnosticoCapturaPerfil & {
      /** RF-25: dimensiones cuyo nodo de captura no tiene una regla de
       * validación cuyos `valores_permitidos` coincidan con el dominio
       * clínico (o no tiene ninguna regla asociada). */
      dimensiones_valores_invalidos: DimensionPerfilClinico[];
      /** RF-27B: dimensiones con captura por valor a las que les falta algún valor. */
      dimensiones_valores_faltantes?: {
        dimension: DimensionPerfilClinico;
        valores_faltantes: string[];
      }[];
    },
  ) {
    super(
      'El árbol conversacional grupal no tiene configurado un nodo para la captura de esta variable clínica.',
    );
  }
}
