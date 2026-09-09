import { ForbiddenException } from "@nestjs/common";

export class unidadTemporalFinalizadaException extends ForbiddenException {
    constructor() {
        super('No se puede modificar la unidad temporal porque ya se encuentra finalizada o activa. Por favor, verifique las fechas de inicio y fin de la unidad temporal antes de intentar modificarla.');
    }
}