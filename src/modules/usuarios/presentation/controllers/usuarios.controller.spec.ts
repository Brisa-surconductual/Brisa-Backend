import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';
import { Rol } from '../../domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../guards/csrf-session.guard';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { SessionScopeGuard } from '../guards/session-scope.guard';
import { UsuariosController } from './usuarios.controller';

describe('UsuariosController - creación administrativa', () => {
  it('exige sesión completa, rol administrativo y CSRF', () => {
    const handler = UsuariosController.prototype.crearAdministrativo;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const roles = Reflect.getMetadata(ROLES_KEY, handler) as string[];
    const alcances = Reflect.getMetadata(
      ALCANCES_SESION_KEY,
      handler,
    ) as AlcanceSesion[];

    expect(guards).toEqual([
      SessionAuthGuard,
      SessionScopeGuard,
      RolesGuard,
      CsrfSessionGuard,
    ]);
    expect(roles).toEqual([Rol.ADMINISTRATIVO]);
    expect(alcances).toEqual([AlcanceSesion.COMPLETA]);
  });
});
