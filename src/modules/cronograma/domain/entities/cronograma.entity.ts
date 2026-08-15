import { EstadoCronograma } from '../enums/estado-cronograma.enum';

export class Cronograma {
  constructor(
    readonly id_cronograma: string,
    readonly nombre_cronograma: string,
    readonly estado: EstadoCronograma,
    readonly es_base: boolean,
    readonly fecha_activacion: Date | null,
    readonly fecha_creacion: Date,
    readonly fecha_actualizacion: Date,
  ) {}
}
