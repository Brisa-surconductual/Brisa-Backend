import { Injectable } from '@nestjs/common';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { SessionConfig } from '../ports/session-config';

export interface ResultadoExpiracionSesiones {
  inactividad: number;
  segundoPlano: number;
}

@Injectable()
export class ExpirarSesionesUseCase {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly sessionConfig: SessionConfig,
  ) {}

  async execute(
    ahora: Date = new Date(),
  ): Promise<ResultadoExpiracionSesiones> {
    const limiteInactividad = new Date(
      ahora.getTime() -
        this.sessionConfig.obtenerLimiteInactividadMinutos() * 60_000,
    );
    const limiteSegundoPlano = new Date(
      ahora.getTime() -
        this.sessionConfig.obtenerLimiteSegundoPlanoMinutos() * 60_000,
    );

    const inactividad = await this.sesionRepository.expirarPorInactividad(
      limiteInactividad,
      ahora,
    );
    const segundoPlano = await this.sesionRepository.expirarPorSegundoPlano(
      limiteSegundoPlano,
      ahora,
    );

    return { inactividad, segundoPlano };
  }
}
