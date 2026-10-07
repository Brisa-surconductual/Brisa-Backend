import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaUbicacionesTemporalesParticipantesException } from '../../../domain/exeption/cronograma/consulta-ubicaciones-temporales-participantes.exception';
import { UbicacionesTemporalesParticipantesRepository } from '../../../domain/repositories/ubicaciones-temporales-participantes.repository';
import { ConsultarUbicacionesTemporalesParticipantesDtoRequest } from '../../dto/cronograma/consultar-ubicaciones-temporales-participantes.dto-request';
import { UbicacionesTemporalesParticipantesDtoResponse } from '../../dto/cronograma/ubicaciones-temporales-participantes.dto-response';

@Injectable()
export class ConsultarUbicacionesTemporalesParticipantesUseCase {
  constructor(
    private readonly repository: UbicacionesTemporalesParticipantesRepository,
  ) {}

  async execute(
    dto: ConsultarUbicacionesTemporalesParticipantesDtoRequest,
  ): Promise<UbicacionesTemporalesParticipantesDtoResponse> {
    const fechaCalculo = dto.fecha_calculo ?? new Date();

    try {
      const resultado = await this.repository.consultar({
        pagina: dto.page,
        limite: dto.page_size,
        fechaCalculo,
        idUsuario: dto.id_usuario,
        idCronograma: dto.id_cronograma,
        idUnidadTemporal: dto.id_unidad_temporal,
        cronogramaFinalizado: dto.cronograma_finalizado,
      });

      return UbicacionesTemporalesParticipantesDtoResponse.crear(
        resultado,
        dto.page,
        dto.page_size,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaUbicacionesTemporalesParticipantesException();
    }
  }
}
