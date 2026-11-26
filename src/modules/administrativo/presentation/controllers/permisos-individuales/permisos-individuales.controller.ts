import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import { ListarPermisosIndividualesDtoRequest } from '../../../application/dto/permisos-individuales/listar-permisos-individuales.dto-request';
import { OtorgarPermisoIndividualDtoRequest } from '../../../application/dto/permisos-individuales/otorgar-permiso-individual.dto-request';
import { ListarPermisosIndividualesUseCase } from '../../../application/use-cases/permisos-individuales/listar-permisos-individuales.use-case';
import { OtorgarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/otorgar-permiso-individual.use-case';
import { RevocarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/revocar-permiso-individual.use-case';
import { SolicitudInvalidaPermisosFilter } from '../../filters/solicitud-invalida-permisos.filter';
import { contextoAuditoria } from '../../http/contexto-auditoria';

/**
 * RF-04: gestión de permisos explícitos de acceso individual. Exclusivo de
 * COORDINADOR_PSI, para que un ADMINISTRATIVO no pueda concederlos sin supervisión.
 */
@Controller('admin/permisos-individuales')
@Roles(Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
@UseFilters(SolicitudInvalidaPermisosFilter)
export class PermisosIndividualesController {
  constructor(
    private readonly otorgarPermiso: OtorgarPermisoIndividualUseCase,
    private readonly listarPermisos: ListarPermisosIndividualesUseCase,
    private readonly revocarPermiso: RevocarPermisoIndividualUseCase,
  ) {}

  @Post()
  @UseGuards(CsrfSessionGuard)
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  otorgar(
    @Body() dto: OtorgarPermisoIndividualDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.otorgarPermiso.execute(contextoAuditoria(request), dto);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  listar(
    @Query() consulta: ListarPermisosIndividualesDtoRequest,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.listarPermisos.execute(contextoAuditoria(request), consulta);
  }

  @Post(':id_permiso/revocar')
  @UseGuards(CsrfSessionGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  revocar(
    @Param('id_permiso', ParseUUIDPipe) idPermiso: string,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    return this.revocarPermiso.execute(contextoAuditoria(request), idPermiso);
  }
}
