import { UbicacionTemporalUsuario } from '../../../domain/entities/ubicacion-temporal-usuario.entity';

export class UbicacionTemporalUsuarioDtoResponse {
  id_usuario!: string;
  id_cronograma_usuario!: string;
  id_cronograma!: string;
  id_unidad_temporal!: string | null;
  nombre_unidad!: string | null;
  orden_unidad!: number | null;
  fecha_calculo!: Date;
  tiempo_efectivo_transcurrido_segundos!: number;
  cronograma_finalizado!: boolean;
  mensaje!: string | null;

  static crear(
    ubicacion: UbicacionTemporalUsuario,
  ): UbicacionTemporalUsuarioDtoResponse {
    return {
      id_usuario: ubicacion.idUsuario,
      id_cronograma_usuario: ubicacion.idCronogramaUsuario,
      id_cronograma: ubicacion.idCronograma,
      id_unidad_temporal: ubicacion.idUnidadTemporal,
      nombre_unidad: ubicacion.nombreUnidad,
      orden_unidad: ubicacion.ordenUnidad,
      fecha_calculo: ubicacion.fechaCalculo,
      tiempo_efectivo_transcurrido_segundos:
        ubicacion.tiempoEfectivoTranscurridoSegundos,
      cronograma_finalizado: ubicacion.cronogramaFinalizado,
      mensaje: ubicacion.mensaje,
    };
  }
}
