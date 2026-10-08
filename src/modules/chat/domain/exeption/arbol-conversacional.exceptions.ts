import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class FlujoConversacionalNoEncontradoException extends NotFoundException {
  constructor() {
    super('El flujo conversacional no existe.');
  }
}

export class FlujoConversacionalNoEditableException extends ConflictException {
  constructor() {
    super(
      'Solo se pueden modificar flujos conversacionales en estado BORRADOR.',
    );
  }
}

export class FlujoPersonalizadoNoEncontradoException extends NotFoundException {
  constructor() {
    super('El árbol conversacional personalizado no existe.');
  }
}

export class PerfilClinicoArbolInvalidoException extends UnprocessableEntityException {
  constructor() {
    super(
      'El árbol debe estar asociado a una combinación válida de perfil clínico antes de ser publicado.',
    );
  }
}

export class FlujoPersonalizadoArchivadoException extends ConflictException {
  constructor() {
    super(
      'No es posible publicar un árbol archivado directamente. Debe crearse una nueva versión en estado borrador.',
    );
  }
}

export class VersionPersonalizadaNoClonableException extends ConflictException {
  constructor() {
    super(
      'Solo se puede crear una nueva versión desde un árbol publicado o archivado.',
    );
  }
}

export class FlujoPersonalizadoYaArchivadoException extends ConflictException {
  constructor() {
    super('El árbol conversacional personalizado ya se encuentra archivado.');
  }
}

export class VersionPersonalizadaDuplicadaException extends ConflictException {
  constructor() {
    super('Ya existe esa versión para la combinación de perfil clínico.');
  }
}

export class FlujoPersonalizadoPublicadoExistenteException extends ConflictException {
  constructor() {
    super(
      'Ya existe un árbol personalizado publicado para esa combinación de perfil clínico.',
    );
  }
}

export class EliminacionArbolPersonalizadoProhibidaException extends ForbiddenException {
  constructor() {
    super(
      'No es posible eliminar un árbol conversacional personalizado. Utilice la opción de archivado.',
    );
  }
}

export class FlujoGrupalPublicadoExistenteException extends ConflictException {
  constructor() {
    super('Ya existe un flujo conversacional grupal publicado.');
  }
}

export class NodoConversacionalNoEncontradoException extends NotFoundException {
  constructor() {
    super('El nodo conversacional no existe en el flujo indicado.');
  }
}

export class NodoDestinoNoEncontradoException extends NotFoundException {
  constructor() {
    super('El nodo destino definido no es válido.');
  }
}

export class NodoOrigenNoEncontradoException extends NotFoundException {
  constructor() {
    super('El nodo origen definido no es válido.');
  }
}

export class NodoConversacionalDuplicadoException extends ConflictException {
  constructor() {
    super('El nodo conversacional ya se encuentra registrado.');
  }
}

export class NodoInicialDuplicadoException extends ConflictException {
  constructor() {
    super('El flujo conversacional ya tiene un nodo inicial.');
  }
}

export class NodoInicialInexistenteException extends BadRequestException {
  constructor() {
    super('El flujo conversacional no tiene un nodo inicial válido.');
  }
}

export class NodosHuerfanosException extends BadRequestException {
  constructor(readonly cantidad: number) {
    super('Existen nodos sin conexión dentro del flujo conversacional.');
  }
}

export class CicloConversacionalNoPermitidoException extends BadRequestException {
  constructor() {
    super('El flujo conversacional contiene un ciclo no permitido.');
  }
}

export class TipoNodoNoEncontradoException extends NotFoundException {
  constructor() {
    super('El tipo de nodo indicado no existe.');
  }
}

export class ContenidoCronogramaNoEncontradoException extends NotFoundException {
  constructor() {
    super('El contenido de cronograma asociado no existe.');
  }
}

export class TransicionConversacionalNoEncontradaException extends NotFoundException {
  constructor() {
    super('La transición conversacional no existe en el flujo indicado.');
  }
}

export class OrdenTransicionDuplicadoException extends ConflictException {
  constructor() {
    super(
      'El nodo origen ya tiene una transición con ese orden de evaluación.',
    );
  }
}

export class ReglaValidacionInvalidaException extends BadRequestException {
  constructor(
    mensaje = 'La regla de validación contiene valores incoherentes.',
  ) {
    super(mensaje);
  }
}

export class SolicitudActualizacionVaciaException extends BadRequestException {
  constructor() {
    super('Debe proporcionar al menos un campo para actualizar.');
  }
}

export class PersistenciaArbolConversacionalException extends InternalServerErrorException {
  constructor() {
    super(
      'No fue posible gestionar el árbol conversacional en este momento. Intente nuevamente más tarde.',
    );
  }
}
