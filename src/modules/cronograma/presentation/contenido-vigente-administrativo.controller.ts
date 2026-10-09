import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { AlcancesSesion } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ContenidoVigenteDtoResponse } from '../application/dto/contenidoVigente/contenido-vigente.dto-response';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../application/use-cases/contenido/consultar-contenido-vigente-usuario.use-case';

@Controller('/cronograma/usuarios')
@AlcancesSesion(AlcanceSesion.COMPLETA)
@Roles(Rol.ADMINISTRATIVO)
@UseGuards(SessionAuthGuard, SessionScopeGuard, RolesGuard)
export class ContenidoVigenteAdministrativoController {
  constructor(
    private readonly consultarContenido: ConsultarContenidoVigenteUsuarioUseCase,
  ) {}

  @Get('/:id_usuario/contenidos-vigentes')
  @Header('Cache-Control', 'no-store')
  async consultar(
    @Param('id_usuario', new ParseUUIDPipe()) idUsuario: string,
    @Query() consulta: Record<string, unknown>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ContenidoVigenteDtoResponse[] | undefined> {
    if (Object.keys(consulta).length > 0) {
      throw new BadRequestException(
        'Esta consulta no admite parámetros; utiliza el usuario de la ruta y la fecha actual del servidor.',
      );
    }

    const contenidos = await this.consultarContenido.execute(idUsuario);
    if (contenidos.length === 0) {
      response.status(HttpStatus.NO_CONTENT);
      return undefined;
    }

    return contenidos;
  }
}
