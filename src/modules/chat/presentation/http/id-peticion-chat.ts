import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

const ID_PETICION = Symbol('id-peticion-chat');

export function obtenerIdPeticionChat(
  solicitud: Request & { [ID_PETICION]?: string },
  respuesta: Response,
): string {
  const recibido = solicitud.get('x-request-id');
  const id =
    solicitud[ID_PETICION] ??
    (recibido !== undefined && /^[A-Za-z0-9._-]{1,64}$/u.test(recibido)
      ? recibido
      : randomUUID());
  solicitud[ID_PETICION] = id;
  if (!respuesta.headersSent) respuesta.setHeader('X-Request-Id', id);
  return id;
}
