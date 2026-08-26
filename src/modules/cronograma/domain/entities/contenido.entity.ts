import { randomUUID } from 'crypto';
import { TipoContenido } from '../enums/tipo-contenido.enum';

export class Contenido {
  constructor(
    readonly id_contenido: string,
    readonly nombre_contenido: string,
    readonly tipo_contenido: TipoContenido,
    readonly fecha_creacion: Date,
    readonly fecha_actualizacion: Date,
  ) {}

  static crear(
    nombreContenido: string,
    tipoContenido: TipoContenido,
    fechaCreacion = new Date(),
  ): Contenido {
    return new Contenido(
      randomUUID(),
      nombreContenido.trim(),
      tipoContenido,
      fechaCreacion,
      fechaCreacion,
    );
  }

  actualizar(
    nombreContenido: string | undefined,
    tipoContenido: TipoContenido | undefined,
    fechaActualizacion = new Date(),
  ): Contenido {
    return new Contenido(
      this.id_contenido,
      nombreContenido?.trim() ?? this.nombre_contenido,
      tipoContenido ?? this.tipo_contenido,
      this.fecha_creacion,
      fechaActualizacion,
    );
  }
}
