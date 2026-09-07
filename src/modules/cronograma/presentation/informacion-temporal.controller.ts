import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsultarInformacionTemporalDtoRequest } from '../application/dto/informacionTemporal/consultar-informacion-temporal.dto-request';
import { InformacionTemporalUsuarioDtoResponse } from '../application/dto/informacionTemporal/informacion-temporal-usuario.dto-response';
import { ConsultarInformacionTemporalUsuarioUseCase } from '../application/use-cases/consultar-informacion-temporal-usuario.use-case';
import { ModuloInternoAuthGuard } from './guards/modulo-interno-auth.guard';

@Controller('/cronograma/interno')
export class InformacionTemporalController {
  constructor(
    private readonly consultarInformacionTemporalUseCase: ConsultarInformacionTemporalUsuarioUseCase,
  ) {}

  @Get('/usuarios/:id_usuario/informacion-temporal')
  @Header('Cache-Control', 'no-store')
  @UseGuards(ModuloInternoAuthGuard)
  async consultar(
    @Param('id_usuario', new ParseUUIDPipe()) idUsuario: string,
    @Query() dto: ConsultarInformacionTemporalDtoRequest,
  ): Promise<InformacionTemporalUsuarioDtoResponse> {
    return this.consultarInformacionTemporalUseCase.execute(
      idUsuario,
      dto.fecha_consulta,
    );
  }
}
