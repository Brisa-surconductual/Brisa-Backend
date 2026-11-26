import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../../usuarios/presentation/http/authenticated-session-request';
import { CodigoParticipanteDtoRequest } from '../../../application/dto/seguimiento-individual/seguimiento-individual.dto-request';
import { ExportarSeguimientoIndividualUseCase } from '../../../application/use-cases/seguimiento-individual/exportar-seguimiento-individual.use-case';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { RequierePermisoIndividual } from '../../decorators/requiere-permiso-individual.decorator';
import { contextoAuditoria } from '../../http/contexto-auditoria';
import { camposExtraExportacion } from '../../http/exportacion-individual.query';

/** RF-145 FA2. */
export const MENSAJE_SIN_PERMISO_EXPORTACION =
  'No cuenta con el permiso explícito de acceso individual requerido para consultar o exportar los datos de este participante.';

/**
 * RF-145: exportación CSV del historial cuantitativo de un participante, para
 * interconsultas. Exige permiso individual vigente al ADMINISTRATIVO. El modal
 * de confirmación es del frontend; el backend audita siempre antes de enviar.
 */
@Controller('admin/participantes/:codigo_participante')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ExportacionIndividualController {
  constructor(
    private readonly exportar: ExportarSeguimientoIndividualUseCase,
  ) {}

  @Get('exportacion.csv')
  @Header('Cache-Control', 'no-store')
  @RequierePermisoIndividual(AlcancePermiso.ACCESO_INDIVIDUAL, {
    mensaje: MENSAJE_SIN_PERMISO_EXPORTACION,
  })
  async exportarCsv(
    @Param() params: CodigoParticipanteDtoRequest,
    // Record (no DTO): un parámetro extra no da 400; se sanea (igual que RF-144).
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedSessionRequest,
  ): Promise<StreamableFile> {
    const { nombre, contenido } = await this.exportar.ejecutar(
      contextoAuditoria(request),
      params.codigo_participante,
      camposExtraExportacion(query),
    );
    return new StreamableFile(contenido, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${nombre}"`,
      length: contenido.length,
    });
  }
}
