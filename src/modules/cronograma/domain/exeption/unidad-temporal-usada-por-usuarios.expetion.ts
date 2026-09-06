import { ConflictException } from "@nestjs/common";



export class unidadTemporalUsadaPorUsuariosException extends ConflictException	 {
    constructor() {
        super('No se puede actualizar la unidad temporal usada por usuarios ');
    }
}