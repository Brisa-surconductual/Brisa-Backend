import { Cronograma } from '../../domain/entities/cronograma.entity';
import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';

export class CronogramaMapper {
  static toDomain(cronograma: {
    id_cronograma: string;
    nombre_cronograma: string;
    estado: string;
    es_base: boolean;
    fecha_activacion: Date | null;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
  }): Cronograma {
    return new Cronograma(
      cronograma.id_cronograma,
      cronograma.nombre_cronograma,
      cronograma.estado as EstadoCronograma,
      cronograma.es_base,
      cronograma.fecha_activacion,
      cronograma.fecha_creacion,
      cronograma.fecha_actualizacion,
    );
  }
}
