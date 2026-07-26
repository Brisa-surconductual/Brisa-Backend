import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RestablecerContrasenaUseCase } from '../../application/use-cases/restablecer-contrasena.use-case';
import { SolicitarRecuperacionContrasenaUseCase } from '../../application/use-cases/solicitar-recuperacion-contrasena.use-case';
import { RestablecerContrasenaDto } from '../dto/restablecer-contrasena.dto';
import { SolicitarRecuperacionDto } from '../dto/solicitar-recuperacion.dto';

@Controller('usuarios/recuperacion')
export class RecuperacionController {
  constructor(
    private readonly solicitarRecuperacion: SolicitarRecuperacionContrasenaUseCase,
    private readonly restablecerContrasena: RestablecerContrasenaUseCase,
  ) {}

  @Post('solicitar')
  @HttpCode(HttpStatus.ACCEPTED)
  solicitar(@Body() dto: SolicitarRecuperacionDto, @Req() request: Request) {
    const direccionIp = request.ip || request.socket.remoteAddress || 'unknown';
    return this.solicitarRecuperacion.execute(
      dto.correoElectronico,
      direccionIp,
    );
  }

  @Post('restablecer')
  @HttpCode(HttpStatus.OK)
  restablecer(@Body() dto: RestablecerContrasenaDto) {
    return this.restablecerContrasena.execute(dto);
  }
}
