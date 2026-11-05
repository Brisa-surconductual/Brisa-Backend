import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';

/** Solo administradores con sesión completa. */
export const AccesoAdministrativo = () =>
  applyDecorators(
    AlcancesSesion(AlcanceSesion.COMPLETA),
    Roles(Rol.ADMINISTRATIVO),
    UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard),
  );

/** Solo estudiantes con sesión completa. */
export const AccesoEstudiante = () =>
  applyDecorators(
    AlcancesSesion(AlcanceSesion.COMPLETA),
    Roles(Rol.ESTUDIANTE),
    UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard),
  );
