import {  Body, Controller,
    HttpCode,
    HttpStatus,
    Post,
} from "@nestjs/common";

import { CreacionUsuarioUseCase } from "../../aplication/use-cases/creacion-usuario.use-case";
import { CreacionUsuarioDtoRequest } from "../../aplication/dto/creacion-usuario.dto-request";
import { CreacionUsuarioDtoResponse } from "../../aplication/dto/creacion-usuario.dto-response";

@Controller("/usuarios")
export class UsuariosController {

    constructor(
        private readonly crearUsuario: CreacionUsuarioUseCase,
    ) {}

    @Post("/crear")
    @HttpCode(HttpStatus.CREATED)
    async crear(@Body() dto: CreacionUsuarioDtoRequest,): Promise<CreacionUsuarioDtoResponse> {
        return this.crearUsuario.execute(dto);
    }

}