import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

const RESPUESTA_HTTP_KEY = 'chat:respuesta-http';

/**
 * Forma de la respuesta de un endpoint, declarada sin lógica en el controlador:
 * "dto" es la clase de respuesta de la capa de aplicación que proyecta el
 * resultado del caso de uso (con su método estático "desde"), y "envolver" lo
 * entrega dentro de { data }.
 */
export const RespuestaHttp = <Origen, Resultado>(
  opciones: {
    dto?: { desde: (origen: Origen) => Resultado };
    envolver?: boolean;
  } = {},
) =>
  applyDecorators(
    SetMetadata(RESPUESTA_HTTP_KEY, opciones),
    UseInterceptors(RespuestaHttpInterceptor),
  );

@Injectable()
export class RespuestaHttpInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const opciones = this.reflector.get<{
      dto?: { desde: (origen: unknown) => unknown };
      envolver?: boolean;
    }>(RESPUESTA_HTTP_KEY, contexto.getHandler());

    return siguiente.handle().pipe(
      map((resultado: unknown) => {
        const proyectado =
          opciones?.dto === undefined
            ? resultado
            : opciones.dto.desde(resultado);
        return opciones?.envolver === true ? { data: proyectado } : proyectado;
      }),
    );
  }
}
