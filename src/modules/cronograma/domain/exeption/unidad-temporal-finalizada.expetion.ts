import { ForbiddenException } from "@nestjs/common";

export class unidadTemporalFinalizadaException extends ForbiddenException {
    constructor() {
        super('No se puede actualizar la unidad temporal porque ya se encuentra finalizada ');
    }
}