import {  Body, Controller, HttpCode, HttpStatus, Post, Req} from "@nestjs/common";
import type { Request } from "express";

import { CreacionUsuarioUseCase } from "../../application/use-cases/creacion-usuario.use-case";
import { CreacionUsuarioDtoRequest } from "../../application/dto/creacion-usuario.dto-request";
import { CreacionUsuarioDtoResponse } from "../../application/dto/creacion-usuario.dto-response";
import { SolicitarRecuperacionDtoRequest } from "../../application/dto/solicitar-recuperacion.dto-request";
import { SolicitarRecuperacionDtoResponse } from "../../application/dto/solicitar-recuperacion.dto-response";
import { RecuperacionUseCase } from "../../application/use-cases/recuperacion-contrasena.use-case";
import { ActualizarContrasenaUseCase } from "../../application/use-cases/actualizar-contraseña.use-case";
import { ActualizacionContrasenaDtoRequest } from "../../application/dto/actualizacion-contrasena.dto-request";
import { ActualizacionContrasenaDtoResponse } from "../../application/dto/actualizacion-contrasena.dto-response";

@Controller("/usuarios")
export class UsuariosController {

    constructor(
        private readonly actualizarContrasenaUse: ActualizarContrasenaUseCase,
        private readonly recuperacion: RecuperacionUseCase,
        private readonly crearUsuario: CreacionUsuarioUseCase,
    ) {}

    @Post("/crear")
    @HttpCode(HttpStatus.CREATED)
    async crear(@Body() dto: CreacionUsuarioDtoRequest): Promise<CreacionUsuarioDtoResponse> {
        return this.crearUsuario.execute(dto);
    }

    @Post("/envio-codigo-recuperacion")
    @HttpCode(HttpStatus.CREATED)
    async solicitarRecuperacion( @Body() dto: SolicitarRecuperacionDtoRequest,  @Req() req: Request, ): Promise<SolicitarRecuperacionDtoResponse> {
        const direccionIp = req.ip ?? "";
        return this.recuperacion.execute(dto, direccionIp);
    }

    @Post("/actualizar-contrasena")
    @HttpCode(HttpStatus.OK)
    async actualizarContrasena(@Body() dto: ActualizacionContrasenaDtoRequest): Promise<ActualizacionContrasenaDtoResponse> {
        return this.actualizarContrasenaUse.execute(dto);
    }

    
}