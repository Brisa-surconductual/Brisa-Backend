import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "../ports/password-hasher";
import { UsuarioRepository } from "../../domain/repositories/user.repository";
import { CorreoElectronico } from "../../domain/value-objects/correo_electronico.vo";
import { Usuario } from "../../domain/entities/usuarios.entity";
import {CreacionUsuarioAdminDtoRequest} from "../dto/crear-administrativo.dto-request";
import {CreacionUsuarioAdminDtoResponse} from "../dto/crear-administrativo.dto-response";
import { CorreoDuplicadoException } from "../../domain/exeption/correo-duplicado.exeption";

@Injectable()
export class CreacionAdministradorUseCase{
    constructor(
        private readonly usuarioRepository:UsuarioRepository,
        private readonly passwordHasher:PasswordHasher,
    ){}

    async execute(dto:CreacionUsuarioAdminDtoRequest ):Promise<CreacionUsuarioAdminDtoResponse>{
        const hash = await this.passwordHasher.hash(dto.contrasena);
        const correo = new CorreoElectronico(dto.correoElectronico);

        const existe = await this.usuarioRepository.buscarPorCorreo(dto.correoElectronico);
               if(existe)
                    {
                        throw new CorreoDuplicadoException();
                    }
       
        const usuario = Usuario.crearAdministrativo(
            correo,
            hash,
        );

        await this.usuarioRepository.crearAdministrador(usuario);

        return CreacionUsuarioAdminDtoResponse.crear()

    }
}