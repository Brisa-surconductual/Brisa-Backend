import { FechasInconsistentesException } from '../exeption/fechas-incosistentes.exeption';

export class ConsistenciaFechasVO {
    constructor(
        readonly fecha_inicio: Date,
        readonly fecha_fin: Date
    ) {
        if (fecha_inicio >= fecha_fin) {
            throw new FechasInconsistentesException();
        }
    }
}