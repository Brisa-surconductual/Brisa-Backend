import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import {
  ConsultarElegibilidadModalidadDtoRequest,
  HabilitarModalidadPersonalizadaDtoRequest,
} from '../../../application/dto/modalidad-programa.dto-request';
import {
  ElegibilidadModalidadDtoResponse,
  TransicionModalidadDtoResponse,
} from '../../../application/dto/modalidad-programa.dto-response';
import { ConsultarElegibilidadModalidadUseCase } from '../../../application/use-cases/modalidad/consultar-elegibilidad-modalidad.use-case';
import { HabilitarModalidadPersonalizadaUseCase } from '../../../application/use-cases/modalidad/habilitar-modalidad-personalizada.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';

/** RF-25B: transición de la modalidad terapéutica de un programa, de grupal a personalizada. */
@Controller('/chat/admin/modalidad')
@AccesoAdministrativo()
export class ModalidadProgramaController {
  constructor(
    private readonly consultarElegibilidad: ConsultarElegibilidadModalidadUseCase,
    private readonly habilitarModalidad: HabilitarModalidadPersonalizadaUseCase,
  ) {}

  @Get('/elegibilidad')
  @Header('Cache-Control', 'no-store')
  elegibilidad(
    @Query() dto: ConsultarElegibilidadModalidadDtoRequest,
  ): Promise<ElegibilidadModalidadDtoResponse> {
    return this.consultarElegibilidad.execute(dto);
  }

  @Post('/habilitar-personalizada')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  habilitar(
    @Body() dto: HabilitarModalidadPersonalizadaDtoRequest,
    @IdUsuarioSesion() idAdministrador: string,
  ): Promise<TransicionModalidadDtoResponse> {
    return this.habilitarModalidad.execute(dto, idAdministrador);
  }
}
