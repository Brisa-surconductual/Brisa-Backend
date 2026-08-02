import { NotFoundException } from "@nestjs/common";

export class UsuarioNoEncontradoException extends NotFoundException {
    constructor() {
        super("No se encontró un usuario con el ID proporcionado.");
    }
}