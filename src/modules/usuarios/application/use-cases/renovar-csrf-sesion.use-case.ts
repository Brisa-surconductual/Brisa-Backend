import { Injectable } from '@nestjs/common';
import { SesionNoActivaException } from '../../domain/exeption/sesion-no-activa.exception';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { SessionTokenGenerator } from '../ports/session-token-generator';
import { SessionTokenHasher } from '../ports/session-token-hasher';

@Injectable()
export class RenovarCsrfSesionUseCase {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly sessionTokenGenerator: SessionTokenGenerator,
    private readonly sessionTokenHasher: SessionTokenHasher,
  ) {}

  async execute(idSesion: string): Promise<string> {
    const csrfToken = this.sessionTokenGenerator.generarToken();
    const csrfTokenHash = await this.sessionTokenHasher.hash(csrfToken);
    const actualizada = await this.sesionRepository.actualizarCsrfToken(
      idSesion,
      csrfTokenHash,
    );

    if (!actualizada) {
      throw new SesionNoActivaException();
    }

    return csrfToken;
  }
}
