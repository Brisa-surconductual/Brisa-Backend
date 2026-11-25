import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../../../shared/presentation/decorators/roles.decorator';
import { AlcanceSesion } from '../../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../../usuarios/presentation/decorators/alcances-sesion.decorator';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { ConsultarBitacoraUseCase } from '../../application/use-cases/consultar-bitacora.use-case';
import { AccesoBitacoraGuard } from '../guards/acceso-bitacora.guard';
import { ACCESO_BITACORA, contextoAuditoria } from '../http/contexto-auditoria';

@Controller('administrativo/auditoria')
export class BitacoraController {
  constructor(private readonly consultar: ConsultarBitacoraUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @Roles(Rol.ADMINISTRATIVO, Rol.COORDINADOR_PSI)
  @AlcancesSesion(AlcanceSesion.COMPLETA)
  @UseGuards(AccesoBitacoraGuard)
  listar(
    @Req() request: AuthenticatedSessionRequest,
    @Query('antes_de') antesDe: unknown,
    @Query('limite') limite: unknown,
  ) {
    return this.consultar.execute(
      contextoAuditoria(request),
      ACCESO_BITACORA,
      antesDe,
      limite,
    );
  }
}
