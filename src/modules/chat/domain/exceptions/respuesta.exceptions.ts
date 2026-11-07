import { DomainException } from './domain.exception';

export class RespuestaConversacionalNoEncontradaException extends DomainException {
  readonly tipo = 'NO_ENCONTRADO' as const;
}

export class ConflictoRespuestaConversacionalException extends DomainException {
  readonly tipo = 'CONFLICTO' as const;
}

export class RespuestaUsuarioInvalida extends DomainException {
  readonly tipo = 'SOLICITUD_INVALIDA' as const;

  constructor(
    mensaje: string,
    codigo: string,
    readonly campo = 'valor',
  ) {
    super(mensaje, codigo);
  }
}

/** Configuración del árbol; nunca debe atribuirse al dato del estudiante. */
export class ConfiguracionRespuestaInvalida extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function configuracionRespuestaInvalida(mensaje: string): never {
  throw new ConfiguracionRespuestaInvalida('SIN_TRANSICION', mensaje);
}
