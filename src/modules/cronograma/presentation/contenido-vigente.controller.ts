import {
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
import { ConsultarContenidoVigenteDtoRequest } from '../application/dto/contenidoVigente/consultar-contenido-vigente.dto-request';
import { ContenidoVigenteDtoResponse } from '../application/dto/contenidoVigente/contenido-vigente.dto-response';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../application/use-cases/consultar-contenido-vigente-usuario.use-case';
import { ModuloInternoAuthGuard } from './guards/modulo-interno-auth.guard';

@Controller('/cronograma/interno')
export class ContenidoVigenteController {
  constructor(
    private readonly consultarContenidoVigenteUseCase: ConsultarContenidoVigenteUsuarioUseCase,
  ) {}

  @Get('/usuarios/:id_usuario/contenidos-vigentes')
  @Header('Cache-Control', 'no-store')
  @UseGuards(ModuloInternoAuthGuard)
  async consultar(
    @Param('id_usuario', new ParseUUIDPipe()) idUsuario: string,
    @Query() dto: ConsultarContenidoVigenteDtoRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ContenidoVigenteDtoResponse[] | undefined> {
    const contenidos = await this.consultarContenidoVigenteUseCase.execute(
      idUsuario,
      dto.fecha_consulta,
    );

    if (contenidos.length === 0) {
      response.status(HttpStatus.NO_CONTENT);
      return undefined;
    }

    return contenidos;
  }
}
