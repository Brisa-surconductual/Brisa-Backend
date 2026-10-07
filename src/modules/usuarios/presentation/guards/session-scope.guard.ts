import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { AlcanceSesionInsuficienteException } from '../../domain/exeption/alcance-sesion-insuficiente.exception';
import { ALCANCES_SESION_KEY } from '../decorators/alcances-sesion.decorator';
import { AuthenticatedSessionRequest } from '../http/authenticated-session-request';

@Injectable()
export class SessionScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<AlcanceSesion[]>(
      ALCANCES_SESION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permitidos || permitidos.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedSessionRequest>();
    const alcance = request.autenticacion?.sesion.alcance_sesion;

    if (!alcance || !permitidos.includes(alcance)) {
      throw new AlcanceSesionInsuficienteException();
    }

    return true;
  }
}
