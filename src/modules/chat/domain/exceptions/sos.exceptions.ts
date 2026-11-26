import { DomainException } from './domain.exception';

/** RF-43: no hay un flujo SOS publicado. */
export class SinFlujoSosException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('No hay un flujo SOS publicado.', 'SIN_FLUJO_SOS');
  }
}

/** RF-43: el estudiante ya tiene una intervención SOS vigente. */
export class IntervencionSosEnCursoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor(idIntervencion: string, finMaximoServidor: string) {
    super('Ya hay una intervención SOS en curso.', 'INTERVENCION_EN_CURSO', {
      id_intervencion: idIntervencion,
      fin_maximo_servidor: finMaximoServidor,
    });
  }
}

/** RF-43: la intervención no existe o pertenece a otro estudiante. */
export class IntervencionSosNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('La intervención SOS no existe.', 'INTERVENCION_NO_ENCONTRADA');
  }
}

/** RF-43: la intervención ya se cerró. */
export class IntervencionSosFinalizadaException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('La intervención SOS ya finalizó.', 'INTERVENCION_FINALIZADA');
  }
}

/** RF-43: la respuesta llegó después de fin_maximo_servidor (reloj del servidor). */
export class TiempoSosAgotadoException extends DomainException {
  readonly tipo = 'CONFLICTO';

  constructor() {
    super(
      'Se agotó el tiempo máximo de la intervención SOS.',
      'TIEMPO_AGOTADO',
    );
  }
}
