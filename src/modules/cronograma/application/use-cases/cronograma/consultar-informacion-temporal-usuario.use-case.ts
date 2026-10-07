import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaInformacionTemporalException } from '../../../domain/exeption/cronograma/consulta-informacion-temporal.exception';
import { InformacionTemporalUsuarioRepository } from '../../../domain/repositories/informacion-temporal-usuario.repository';
import { InformacionTemporalUsuarioDtoResponse } from '../../dto/informacionTemporal/informacion-temporal-usuario.dto-response';

@Injectable()
export class ConsultarInformacionTemporalUsuarioUseCase {
  constructor(
    private readonly informacionTemporalRepository: InformacionTemporalUsuarioRepository,
  ) {}

  async execute(
    idUsuario: string,
    fechaConsulta: Date = new Date(),
  ): Promise<InformacionTemporalUsuarioDtoResponse> {
    try {
      const informacion = await this.informacionTemporalRepository.consultar(
        idUsuario,
        fechaConsulta,
      );

      return InformacionTemporalUsuarioDtoResponse.crear(informacion);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ConsultaInformacionTemporalException();
    }
  }
}
