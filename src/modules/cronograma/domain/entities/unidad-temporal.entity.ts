import { randomUUID } from "crypto";


export class UnidadTemporal {
  constructor(
    readonly id_unidad_Temporal: string,
    readonly id_cronograma: string,
    readonly nombre: String,
    readonly orden_unidad: number,
    readonly fecha_inicio: Date,
    readonly fecha_fin: Date,
    readonly utilizada_por_usuario: boolean,
    readonly fecha_creacion: Date,
    readonly fecha_actualizacion: Date,
  ) {}


  static crear(
    id_cronograma: string,
    nombre: String,
    orden_unidad: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): UnidadTemporal {
    return new UnidadTemporal(
      randomUUID(),
      id_cronograma,
      nombre,
      orden_unidad,
      fecha_inicio,
      fecha_fin,
      false,
      new Date(),
      new Date
    );
  }
}


