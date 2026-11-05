import { HttpException } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions';
import { PersistenciaArbolConversacionalException } from '../exceptions/persistencia-arbol-conversacional.exception';

/**
 * Deja pasar las excepciones de negocio y de HTTP; cualquier otro fallo
 * (base de datos, red) se oculta tras una excepción genérica.
 */
export async function ejecutarSeguro<T>(
  operacion: () => Promise<T>,
): Promise<T> {
  try {
    return await operacion();
  } catch (error: unknown) {
    if (error instanceof HttpException || error instanceof DomainException)
      throw error;
    throw new PersistenciaArbolConversacionalException();
  }
}
