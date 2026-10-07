import { EstadoCronograma } from '../enums/estado-cronograma.enum';
import { randomUUID } from 'crypto';

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

  static crearCronograma(
    nombre_cronograma: string,
    es_base: boolean,
    fecha_activacion: Date | null,
  ): Cronograma {
    const ahora = new Date();

    return new Cronograma(
      randomUUID(),
      nombre_cronograma,
      EstadoCronograma.INACTIVO,
      es_base,
      fecha_activacion,
      ahora,
      ahora,
    );
  }
}
