import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { ConfiguracionException } from '../../application/exceptions/configuracion.exception';
import { contieneCampoPorUsuario } from '../../domain/policies/configuracion-global.policy';

export const MENSAJE_SOLO_GLOBAL_KEY = 'mensaje_configuracion_solo_global';

/**
 * RF-137: rechaza con 400 CONFIGURACION_SOLO_GLOBAL cualquier intento de
 * asociar la configuración a un usuario o participante, en el cuerpo (incluido
 * el interior de `valor_nuevo`) o en la query.
 *
 * Es un interceptor porque corre después de los guards (sesión, rol, CSRF) y
 * antes de los pipes: así responde con su propio código antes de que el
 * ValidationPipe global rechace el campo desconocido con un 400 genérico.
 */
@Injectable()
export class ConfiguracionSoloGlobalInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      contieneCampoPorUsuario(request.body) ||
      contieneCampoPorUsuario(request.query)
    ) {
      const mensaje = this.reflector.getAllAndOverride<string | undefined>(
        MENSAJE_SOLO_GLOBAL_KEY,
        [context.getHandler(), context.getClass()],
      );
      throw ConfiguracionException.de('CONFIGURACION_SOLO_GLOBAL', {
        mensaje,
      });
    }
    return next.handle();
  }
}
