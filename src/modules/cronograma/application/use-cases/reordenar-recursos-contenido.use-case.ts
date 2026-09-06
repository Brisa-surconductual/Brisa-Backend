import { Injectable } from '@nestjs/common';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { ReordenarRecursosContenidoDtoRequest } from '../dto/reordenar-recursos-contenido.dto-request';
import { ReordenarRecursosContenidoDtoResponse } from '../dto/reordenar-recursos-contenido.dto-response';

@Injectable()
export class ReordenarRecursosContenidoUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly recursoRepository: RecursoContenidoRepository,
  ) {}

  async execute(
    idContenido: string,
    dto: ReordenarRecursosContenidoDtoRequest,
  ): Promise<ReordenarRecursosContenidoDtoResponse> {
    const contenido = await this.contenidoRepository.buscarPorId(idContenido);
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    await this.recursoRepository.reordenar(idContenido, dto.id_recursos);
    return new ReordenarRecursosContenidoDtoResponse();
  }
}
