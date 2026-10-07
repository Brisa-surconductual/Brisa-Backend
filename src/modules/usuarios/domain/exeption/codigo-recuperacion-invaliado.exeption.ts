import { BadRequestException } from "@nestjs/common";

export class CodigoRecuperacionInvalidoException extends BadRequestException {
    constructor() {
        super("El código de recuperación no es válido o ha expirado.");
    }
}