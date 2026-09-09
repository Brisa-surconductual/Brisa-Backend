import { ConflictException } from "@nestjs/common";

export class unidadTemporalConContenidoException extends ConflictException	 {
    constructor() {
        super(
            `La unidad temporal tiene contenidos asociados y no puede ser eliminada.`,
        );
    }
}