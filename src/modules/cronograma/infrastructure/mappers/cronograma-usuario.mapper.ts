import { CronogramaUsuario } from '../../domain/entities/cronograma-usuario.entity';

export class CronogramaUsuarioMapper {
  static toDomain(cronogramaUsuario: {
    id_cronograma_usuario: string;
    id_usuario: string;
    id_cronograma: string;
    fecha_inicio_usuario: Date;
    fecha_creacion: Date;
  }): CronogramaUsuario {
    return new CronogramaUsuario(
      cronogramaUsuario.id_cronograma_usuario,
      cronogramaUsuario.id_usuario,
      cronogramaUsuario.id_cronograma,
      cronogramaUsuario.fecha_inicio_usuario,
      cronogramaUsuario.fecha_creacion,
    );
  }

  static toPrisma(cronogramaUsuario: CronogramaUsuario) {
    return {
      id_cronograma_usuario: cronogramaUsuario.id_cronograma_usuario,
      id_usuario: cronogramaUsuario.id_usuario,
      id_cronograma: cronogramaUsuario.id_cronograma,
      fecha_inicio_usuario: cronogramaUsuario.fecha_inicio_usuario,
      fecha_creacion: cronogramaUsuario.fecha_creacion,
    };
  }
}
