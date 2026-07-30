import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Permiso } from '../../domain/enums/permiso.enum';
import { AccesoDenegadoException } from '../../domain/exceptions/usuario.exceptions';
import { rolTienePermiso } from '../../domain/services/permisos-por-rol';
import { AuthenticatedRequest } from './authenticated-request';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permiso[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const allowed = required.every((permission) =>
      rolTienePermiso(user.rol, permission),
    );

    const triesPersonalFeature = required.includes(
      Permiso.USAR_FUNCIONALIDADES_PERSONALES,
    );
    const completedWhenRequired =
      !triesPersonalFeature ||
      user.estadoRegistro === EstadoRegistro.REGISTRO_COMPLETO;

    if (!allowed || !completedWhenRequired) {
      throw new AccesoDenegadoException();
    }

    return true;
  }
}
