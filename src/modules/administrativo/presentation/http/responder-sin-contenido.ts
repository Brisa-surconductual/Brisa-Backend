import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Consultas individuales (RF-128 a RF-131): si el módulo fuente no tiene datos
 * del participante, responde 204 sin cuerpo. Requiere `@Res({ passthrough: true })`.
 */
export function responderSinContenido<T>(
  response: Response,
  datos: T | null,
): T | undefined {
  if (datos === null) {
    response.status(HttpStatus.NO_CONTENT);
    return undefined;
  }
  return datos;
}
