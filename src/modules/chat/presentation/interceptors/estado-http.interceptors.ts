import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { InicioSesionConversacionalDtoResponse } from '../../application/dto/sesion-conversacional.dto-response';

@Injectable()
export class EstadoSesionIniciadaInterceptor implements NestInterceptor {
  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const respuesta = contexto.switchToHttp().getResponse<Response>();

    return siguiente.handle().pipe(
      tap((resultado: InicioSesionConversacionalDtoResponse) => {
        respuesta.status(
          resultado.reanudada ? HttpStatus.OK : HttpStatus.CREATED,
        );
      }),
    );
  }
}

@Injectable()
export class SinContenidoInterceptor implements NestInterceptor {
  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const respuesta = contexto.switchToHttp().getResponse<Response>();

    return siguiente.handle().pipe(
      tap((resultado: unknown[]) => {
        if (resultado.length === 0) respuesta.status(HttpStatus.NO_CONTENT);
      }),
    );
  }
}
