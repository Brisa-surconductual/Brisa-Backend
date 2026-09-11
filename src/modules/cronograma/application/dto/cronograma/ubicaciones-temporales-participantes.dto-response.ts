import { PaginaUbicacionesTemporalesParticipantes } from '../../../domain/repositories/ubicaciones-temporales-participantes.repository';
import { UbicacionTemporalParticipanteDtoResponse } from './ubicacion-temporal-participante.dto-response';

export class UbicacionesTemporalesParticipantesDtoResponse {
  total!: number;
  page!: number;
  page_size!: number;
  participantes!: UbicacionTemporalParticipanteDtoResponse[];

  static crear(
    resultado: PaginaUbicacionesTemporalesParticipantes,
    page: number,
    pageSize: number,
  ): UbicacionesTemporalesParticipantesDtoResponse {
    return {
      total: resultado.total,
      page,
      page_size: pageSize,
      participantes: resultado.participantes.map((participante) =>
        UbicacionTemporalParticipanteDtoResponse.crear(participante),
      ),
    };
  }
}
