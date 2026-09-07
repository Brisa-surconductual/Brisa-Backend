import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaPausasAdministrativasException } from '../../domain/exeption/consulta-pausas-administrativas.exception';
import { PausaAdministrativaRepository } from '../../domain/repositories/pausa-administrativa.repository';
import { PausaAdministrativaDtoResponse } from '../dto/pausaAdministrativa/pausa-administrativa.dto-response';

@Injectable()
export class ConsultarPausasAdministrativasUsuarioUseCase {
  constructor(
    private readonly pausaRepository: PausaAdministrativaRepository,
  ) {}

  async execute(
    idUsuario: string,
    fechaConsulta: Date = new Date(),
  ): Promise<PausaAdministrativaDtoResponse[]> {
    try {
      const pausas = await this.pausaRepository.listarPorUsuario(
        idUsuario,
        fechaConsulta,
      );

      return pausas.map((pausa) => PausaAdministrativaDtoResponse.crear(pausa));
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ConsultaPausasAdministrativasException();
    }
  }
}
