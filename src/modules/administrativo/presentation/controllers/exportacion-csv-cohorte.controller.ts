import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  StreamableFile,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { ExportarIndicadoresCohorteUseCase } from '../../application/use-cases/exportar-indicadores-cohorte.use-case';
import { AuditarAccesoExportacionCsvFilter } from '../filters/auditar-acceso-exportacion-csv.filter';
import { contextoAuditoria } from '../http/contexto-auditoria';

const SELECTORES_COLUMNAS = ['fields', 'columns', 'columnas'];

@Controller('admin/cohortes/:id_cohorte/exportacion.csv')
@Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
@AlcancesSesion(AlcanceSesion.COMPLETA)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
@UseFilters(AuditarAccesoExportacionCsvFilter)
export class ExportacionCsvCohorteController {
  constructor(private readonly exportar: ExportarIndicadoresCohorteUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async obtener(
    @Param('id_cohorte', ParseUUIDPipe) idCohorte: string,
    @Query() query: Record<string, unknown>,
    @Req() request: AuthenticatedSessionRequest,
  ) {
    const pidePii = [query.include_pii].flat().includes('true');
    const eligeColumnas = SELECTORES_COLUMNAS.some((parametro) =>
      Object.hasOwn(query, parametro),
    );
    const { nombre, contenido } = await this.exportar.ejecutar(
      contextoAuditoria(request),
      idCohorte,
      pidePii || eligeColumnas,
    );

    return new StreamableFile(contenido, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${nombre}"`,
      length: contenido.length,
    });
  }
}
