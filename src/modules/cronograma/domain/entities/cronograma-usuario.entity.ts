import { randomUUID } from 'crypto';

export class CronogramaUsuario {
  constructor(
    readonly id_cronograma_usuario: string,
    readonly id_usuario: string,
    readonly id_cronograma: string,
    readonly fecha_inicio_usuario: Date,
    readonly fecha_creacion: Date,
  ) {}

  static inicializar(
    idUsuario: string,
    idCronograma: string,
    ahora: Date = new Date(),
  ): CronogramaUsuario {
    return new CronogramaUsuario(
      randomUUID(),
      idUsuario,
      idCronograma,
      ahora,
      ahora,
    );
  }
}
