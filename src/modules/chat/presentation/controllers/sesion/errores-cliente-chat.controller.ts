import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { IsIn, IsUUID, ValidateIf } from 'class-validator';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { CODIGOS_ERROR_CLIENTE } from '../../../application/errores-conversacionales';
import { ReportarErrorConversacionalUseCase } from '../../../application/use-cases/sesion/reportar-error-conversacional.use-case';
import { AccesoEstudiante } from '../../decorators/acceso.decorators';
import { IdUsuarioSesion } from '../../decorators/id-usuario-sesion.decorator';
import { obtenerIdPeticionChat } from '../../http/id-peticion-chat';

class ReportarErrorClienteDto {
  @IsIn(CODIGOS_ERROR_CLIENTE)
  codigo!: (typeof CODIGOS_ERROR_CLIENTE)[number];

  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @IsUUID()
  id_sesion?: string;
}

@Controller('/chat')
@AccesoEstudiante()
export class ErroresClienteChatController {
  constructor(private readonly reportar: ReportarErrorConversacionalUseCase) {}

  @Post('/errores-cliente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  @UseGuards(CsrfSessionGuard)
  registrar(
    @IdUsuarioSesion() idUsuario: string,
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
    @Body() datos: ReportarErrorClienteDto,
  ): Promise<void> {
    return this.reportar.execute({
      idUsuario,
      idSesion: datos.id_sesion ?? null,
      codigo: datos.codigo,
      xRequestId: obtenerIdPeticionChat(solicitud, respuesta),
    });
  }
}
