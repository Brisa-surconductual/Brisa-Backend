import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { UnidadTemporal } from '../../../domain/entities/unidad-temporal.entity';

export class ObtenerUnidadesTemporalesDtoResponse {
  @IsString()
  nombreCronograma!: string;

  @IsString()
  nombreUnidadTemporal!: string;

  @IsString()
  idUnidadTemporal!: string;

  @IsNumber()
  orden!: number;

  @IsBoolean()
  esUtilizadoPorUsuario!: boolean;

  @IsDate()
  fechaInicio!: Date;

  @IsDate()
  fechaFin!: Date;

  @IsDate()
  fechaCreacion!: Date;

  @IsDate()
  fechaActualizacion!: Date;

  static respuesta(unidadesTemporales: UnidadTemporal[]): ObtenerUnidadesTemporalesDtoResponse[] {
    return unidadesTemporales.map((unidadTemporal) => {
      const response = new ObtenerUnidadesTemporalesDtoResponse();

      response.nombreCronograma = '';
      response.nombreUnidadTemporal = String(unidadTemporal.nombre);
      response.idUnidadTemporal = unidadTemporal.id_unidad_Temporal;
      response.orden = unidadTemporal.orden_unidad;
      response.esUtilizadoPorUsuario = unidadTemporal.utilizada_por_usuario;
      response.fechaInicio = unidadTemporal.fecha_inicio;
      response.fechaFin = unidadTemporal.fecha_fin;
      response.fechaCreacion = unidadTemporal.fecha_creacion;
      response.fechaActualizacion = unidadTemporal.fecha_actualizacion;

      return response;
    });
  }
}