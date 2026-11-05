import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { ReglaValidacionDtoRequest } from '../../../application/dto/arbol-conversacional.dto-request';
import { ReglaValidacionDtoResponse } from '../../../application/dto/chat-admin.dto-response';
import { CrearReglaValidacionUseCase } from '../../../application/use-cases/arbol-conversacional/crear-regla-validacion.use-case';
import { AccesoAdministrativo } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { RespuestaHttp } from '../../interceptors/respuesta-http.interceptor';

/** Reglas de validación reutilizables por las transiciones. */
@Controller('/chat/admin/reglas-validacion')
@AccesoAdministrativo()
export class ReglasValidacionController {
  constructor(private readonly crearRegla: CrearReglaValidacionUseCase) {}

  @Post()
  @HttpCode(201)
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  crear(
    @Body() dto: ReglaValidacionDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ReglaValidacionDtoResponse> {
    return this.crearRegla.execute(dto, idUsuario);
  }

  /** @deprecated Usar POST; se conserva mientras el front migra. */
  @Patch()
  @HttpCode(201)
  @UseGuards(CsrfSessionGuard)
  @RespuestaHttp({ envolver: true })
  crearHistorica(
    @Body() dto: ReglaValidacionDtoRequest,
    @IdUsuarioSesion() idUsuario: string,
  ): Promise<ReglaValidacionDtoResponse> {
    return this.crearRegla.execute(dto, idUsuario);
  }
}
