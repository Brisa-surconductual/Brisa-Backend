/** Categoría de una regla de negocio incumplida, independiente del transporte. */
export type TipoErrorDominio =
  | 'NO_ENCONTRADO'
  | 'CONFLICTO'
  | 'NO_PROCESABLE'
  | 'SOLICITUD_INVALIDA'
  | 'PROHIBIDO';

/**
 * Base de las excepciones de dominio del módulo administrativo. No conoce
 * Nest ni HTTP: la capa de aplicación/presentación decide cómo traducirlas.
 */
export abstract class AdministrativoDomainException extends Error {
  abstract readonly tipo: TipoErrorDominio;

  constructor(
    mensaje: string,
    readonly codigo: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}
