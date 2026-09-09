import { ForbiddenException } from "@nestjs/common";


export class unidadTemporalEnEjecucionException extends ForbiddenException {
    constructor() {
        super('No se puede actualizar la unidad temporal porque ya se encuentra en ejecución ');
    }
}