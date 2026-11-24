import {
  applyDecorators,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import { OperacionConsultaTrazabilidad } from '../../application/services/auditar-consulta-trazabilidad.service';
import { AutorizacionAdministrativaAuditadaGuard } from '../guards/autorizacion-administrativa-auditada.guard';
import { OPERACION_AUDITADA_KEY } from '../http/auditoria-consulta-trazabilidad';
import { AuditoriaConsultaTrazabilidadInterceptor } from '../interceptors/auditoria-consulta-trazabilidad.interceptor';

/** Solo administradores con sesión completa. */
export const AccesoAdministrativo = () =>
  applyDecorators(
    AlcancesSesion(AlcanceSesion.COMPLETA),
    Roles(Rol.ADMINISTRATIVO),
    UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard),
  );

/**
 * Igual que AccesoAdministrativo (sesión autenticada, alcance COMPLETA y rol
 * ADMINISTRATIVO, con los mismos guards) y, además, registra la consulta en la
 * bitácora de RF-123: DENEGADA si el alcance o el rol fallan; EXITOSA o
 * FALLIDA según el resultado. Los 401 no se registran (ver contrato).
 */
export const AccesoAdministrativoAuditado = (
  operacion: OperacionConsultaTrazabilidad,
) =>
  applyDecorators(
    AlcancesSesion(AlcanceSesion.COMPLETA),
    Roles(Rol.ADMINISTRATIVO),
    SetMetadata(OPERACION_AUDITADA_KEY, operacion),
    UseGuards(SessionAuthGuard, AutorizacionAdministrativaAuditadaGuard),
    UseInterceptors(AuditoriaConsultaTrazabilidadInterceptor),
  );

/** Solo estudiantes con sesión completa. */
export const AccesoEstudiante = () =>
  applyDecorators(
    AlcancesSesion(AlcanceSesion.COMPLETA),
    Roles(Rol.ESTUDIANTE),
    UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard),
  );
