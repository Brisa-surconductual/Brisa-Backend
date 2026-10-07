import { HttpException, Injectable } from '@nestjs/common';
import { AnulacionPausaAdministrativaException } from '../../../domain/exeption/pausa-administrativa/anulacion-pausa-administrativa.exception';
import { PausaAdministrativaNoEncontradaException } from '../../../domain/exeption/pausa-administrativa/pausa-administrativa-no-encontrada.exception';
import { PausaAdministrativaRepository } from '../../../domain/repositories/pausa-administrativa.repository';
import { AnularPausaAdministrativaDtoResponse } from '../../dto/pausaAdministrativa/anular-pausa-administrativa.dto-response';

@Injectable()
export class AnularPausaAdministrativaUseCase {
  constructor(
    private readonly pausaRepository: PausaAdministrativaRepository,
  ) {}

  async execute(
    idUsuario: string,
    idPausa: string,
  ): Promise<AnularPausaAdministrativaDtoResponse> {
    try {
      const pausa = await this.pausaRepository.anular(idUsuario, idPausa);

      if (!pausa) {
        throw new PausaAdministrativaNoEncontradaException();
      }

      return AnularPausaAdministrativaDtoResponse.crear(pausa);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new AnulacionPausaAdministrativaException();
    }
  }
}
