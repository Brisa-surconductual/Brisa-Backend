import { UbicacionTemporalParticipante } from '../entities/ubicacion-temporal-participante.entity';

export interface ConsultaUbicacionesTemporalesParticipantes {
  pagina: number;
  limite: number;
  fechaCalculo: Date;
  idUsuario?: string;
  idCronograma?: string;
  idUnidadTemporal?: string;
  cronogramaFinalizado?: boolean;
}

export interface PaginaUbicacionesTemporalesParticipantes {
  total: number;
  participantes: UbicacionTemporalParticipante[];
}

export abstract class UbicacionesTemporalesParticipantesRepository {
  abstract consultar(
    consulta: ConsultaUbicacionesTemporalesParticipantes,
  ): Promise<PaginaUbicacionesTemporalesParticipantes>;
}
