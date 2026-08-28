import { Injectable } from '@nestjs/common';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { EliminarContenidoDtoResponse } from '../dto/eliminar-contenido.dto-response';

@Injectable()
export class EliminarContenidoUseCase {
  constructor(private readonly contenidoRepository: ContenidoRepository) {}

  async execute(idContenido: string): Promise<EliminarContenidoDtoResponse> {
    const contenido = await this.contenidoRepository.buscarPorId(idContenido);
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    await this.contenidoRepository.eliminar(idContenido);
    return EliminarContenidoDtoResponse.crear();
  }
}
