export type TipoErrorDominio =
  | 'NO_ENCONTRADO'
  | 'CONFLICTO'
  | 'NO_PROCESABLE'
  | 'SOLICITUD_INVALIDA'
  | 'PROHIBIDO';

export abstract class DomainException extends Error {
  abstract readonly tipo: TipoErrorDominio;

  constructor(
    mensaje: string,
    readonly codigo?: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}
