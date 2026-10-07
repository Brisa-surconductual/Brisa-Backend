import { ConflictException } from '@nestjs/common';

export class unidadTemporalUtilizadaPorUsuariosException extends ConflictException	 {
    constructor() {
        super('No se puede eliminar la unidad temporal porque ya ha sido utilizada por usuarios');
    }
}