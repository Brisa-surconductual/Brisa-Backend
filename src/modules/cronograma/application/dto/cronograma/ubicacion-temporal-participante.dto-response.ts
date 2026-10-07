import { UbicacionTemporalParticipante } from '../../../domain/entities/ubicacion-temporal-participante.entity';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';

export class UbicacionTemporalParticipanteDtoResponse {
  id_usuario!: string;
  correo_electronico!: string;
  id_cronograma_usuario!: string | null;
  id_cronograma!: string | null;
  nombre_cronograma!: string | null;
  estado_cronograma!: EstadoCronograma | null;
  fecha_inicio_usuario!: Date | null;
  id_unidad_temporal!: string | null;
  nombre_unidad!: string | null;
  orden_unidad!: number | null;
  fecha_inicio_unidad!: Date | null;
  fecha_fin_unidad!: Date | null;
  fecha_calculo!: Date;
  tiempo_efectivo_transcurrido_segundos!: number | null;
  cronograma_finalizado!: boolean | null;
  en_pausa_administrativa!: boolean;
  mensaje!: string | null;

  static crear(
    participante: UbicacionTemporalParticipante,
  ): UbicacionTemporalParticipanteDtoResponse {
    return {
      id_usuario: participante.idUsuario,
      correo_electronico: participante.correoElectronico,
      id_cronograma_usuario: participante.idCronogramaUsuario,
      id_cronograma: participante.idCronograma,
      nombre_cronograma: participante.nombreCronograma,
      estado_cronograma: participante.estadoCronograma,
      fecha_inicio_usuario: participante.fechaInicioUsuario,
      id_unidad_temporal: participante.idUnidadTemporal,
      nombre_unidad: participante.nombreUnidad,
      orden_unidad: participante.ordenUnidad,
      fecha_inicio_unidad: participante.fechaInicioUnidad,
      fecha_fin_unidad: participante.fechaFinUnidad,
      fecha_calculo: participante.fechaCalculo,
      tiempo_efectivo_transcurrido_segundos:
        participante.tiempoEfectivoTranscurridoSegundos,
      cronograma_finalizado: participante.cronogramaFinalizado,
      en_pausa_administrativa: participante.enPausaAdministrativa,
      mensaje: participante.mensaje,
    };
  }
}
