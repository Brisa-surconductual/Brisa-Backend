import { Injectable } from '@nestjs/common';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { ModuloDestinoDtoResponse } from '../dto/modulo-destino.dto-response';

@Injectable()
export class ListarModulosDestinoUseCase {
  constructor(
    private readonly moduloSistemaRepository: ModuloSistemaRepository,
  ) {}

  async execute(): Promise<ModuloDestinoDtoResponse[]> {
    const modulos = await this.moduloSistemaRepository.listarActivos();
    return modulos.map((modulo) => ModuloDestinoDtoResponse.crear(modulo));
  }
}
