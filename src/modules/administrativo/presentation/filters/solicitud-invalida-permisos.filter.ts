import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { PermisoIndividualException } from '../../application/exceptions/permiso-individual.exception';

/**
 * BE-336: los 400 de validación (cuerpo, query y `:id_permiso`) de los
 * controladores de permisos individuales salen con el sobre
 * `{ status, codigo, mensaje }` y `PARAMETRO_INVALIDO`, como el resto del
 * módulo. Se aplica solo con `@UseFilters` en esos controladores: el
 * `ValidationPipe` global y los demás módulos no cambian. No lee la excepción
 * original, así que el mensaje nunca repite lo que envió el usuario.
 */
@Catch(BadRequestException)
export class SolicitudInvalidaPermisosFilter implements ExceptionFilter {
  catch(_excepcion: BadRequestException, host: ArgumentsHost): void {
    const cuerpo = new PermisoIndividualException(
      'PARAMETRO_INVALIDO',
    ).getResponse();
    host.switchToHttp().getResponse<Response>().status(400).json(cuerpo);
  }
}
