import { NotFoundException } from "@nestjs/common";

export class UsuarioAsociadoNoEncontradoException extends NotFoundException {
    constructor() {
        super("No se encontró un usuario asociado al código de recuperación proporcionado.");
    }
}