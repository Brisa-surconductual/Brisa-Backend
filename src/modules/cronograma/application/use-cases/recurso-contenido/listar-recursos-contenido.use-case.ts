import { Injectable } from '@nestjs/common';
import { ContenidoNoEncontradoException } from '../../../domain/exeption/contenido/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../../domain/repositories/recurso-contenido.repository';
import { ListarRecursosContenidoDtoResponse } from '../../dto/recursoContenido/listar-recursos-contenido.dto-response';

@Injectable()
export class ListarRecursosContenidoUseCase {
  constructor(
    private readonly contenidoRepository: ContenidoRepository,
    private readonly recursoRepository: RecursoContenidoRepository,
  ) {}

  async execute(
    idContenido: string,
  ): Promise<ListarRecursosContenidoDtoResponse[]> {
    const contenido = await this.contenidoRepository.buscarPorId(idContenido);

    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    const recursos =
      await this.recursoRepository.listarPorContenido(idContenido);

    return recursos.map(({ recurso, idModulos }) =>
      ListarRecursosContenidoDtoResponse.crear(recurso, idModulos),
    );
  }
}
