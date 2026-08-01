import {  Body, Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req
} from "@nestjs/common";

import type { Request } from "express";

import { CreacionUsuarioUseCase } from "../../aplication/use-cases/creacion-usuario.use-case";
import { CreacionUsuarioDtoRequest } from "../../aplication/dto/creacion-usuario.dto-request";
import { CreacionUsuarioDtoResponse } from "../../aplication/dto/creacion-usuario.dto-response";
import { SolicitarRecuperacionDtoRequest } from "../../aplication/dto/solicitar-recuperacion.dto-request";
import { SolicitarRecuperacionDtoResponse } from "../../aplication/dto/solicitar-recuperacion.dto-response";
import { RecuperacionUseCase } from "../../aplication/use-cases/recuperacion-contrasena.use-case";
@Controller("/usuarios")
export class UsuariosController {

    constructor(
        private readonly recuperacion: RecuperacionUseCase,
        private readonly crearUsuario: CreacionUsuarioUseCase,
    ) {}

    @Post("/crear")
    @HttpCode(HttpStatus.CREATED)
    async crear(@Body() dto: CreacionUsuarioDtoRequest,): Promise<CreacionUsuarioDtoResponse> {
        return this.crearUsuario.execute(dto);
    }

    @Post("/recuperacion")
    @HttpCode(HttpStatus.CREATED)
    async solicitarRecuperacion( @Body() dto: SolicitarRecuperacionDtoRequest,  @Req() req: Request, ): Promise<SolicitarRecuperacionDtoResponse> {
        const direccionIp = req.ip ?? "";
        return this.recuperacion.execute(dto, direccionIp);
    }
}