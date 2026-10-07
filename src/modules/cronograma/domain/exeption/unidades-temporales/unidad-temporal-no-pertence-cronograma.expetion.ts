import { HttpException, HttpStatus } from '@nestjs/common';

export class UnidadTemporalNoPerteneceACronogramaException extends HttpException {
    constructor() {
        super('La unidad temporal especificada no pertenece al cronograma indicado.', HttpStatus.FORBIDDEN);
    }
}