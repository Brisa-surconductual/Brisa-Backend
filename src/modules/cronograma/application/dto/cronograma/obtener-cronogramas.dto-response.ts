import { IsBoolean, IsDate, IsEnum, IsString } from 'class-validator';
import { Cronograma } from '../../../domain/entities/cronograma.entity';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';

export class ObtenerCronogramasDtoResponse {
  @IsString()
  idCronograma: string;

  @IsString()
  nombreCronograma: string;

  @IsEnum(EstadoCronograma)
  estado: EstadoCronograma;

  @IsBoolean()
  esBase: boolean;

  @IsDate()
  fechaCreacion: Date;

  @IsDate()
  fechaActualizacion: Date;

  static respuesta(cronogramas: Cronograma[]): ObtenerCronogramasDtoResponse[] {
    return cronogramas.map((cronograma): ObtenerCronogramasDtoResponse => {
      const response = new ObtenerCronogramasDtoResponse();
      response.idCronograma = cronograma.id_cronograma;
      response.nombreCronograma = cronograma.nombre_cronograma;
      response.estado = cronograma.estado;
      response.esBase = cronograma.es_base;
      response.fechaCreacion = cronograma.fecha_creacion;
      response.fechaActualizacion = cronograma.fecha_actualizacion;
      return response;
    });
  }
}
