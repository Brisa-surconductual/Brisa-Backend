import { BadRequestException, Injectable } from '@nestjs/common';
import { ContenidoNoEncontradoException } from '../../domain/exeption/contenido-no-encontrado.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { ActualizarContenidoDtoRequest } from '../dto/actualizar-contenido.dto-request';
import { ContenidoDtoResponse } from '../dto/contenido.dto-response';

@Injectable()
export class ActualizarContenidoUseCase {
  constructor(private readonly contenidoRepository: ContenidoRepository) {}

  async execute(
    idContenido: string,
    dto: ActualizarContenidoDtoRequest,
  ): Promise<ContenidoDtoResponse> {
    if (
      dto.nombre_contenido === undefined &&
      dto.tipo_contenido === undefined
    ) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar.',
      );
    }

    const contenido = await this.contenidoRepository.buscarPorId(idContenido);
    if (!contenido) {
      throw new ContenidoNoEncontradoException();
    }

    const contenidoActualizado = contenido.actualizar(
      dto.nombre_contenido,
      dto.tipo_contenido,
    );
    const resultado =
      await this.contenidoRepository.actualizar(contenidoActualizado);

    return ContenidoDtoResponse.crear(
      resultado,
      'Contenido psicoeducativo actualizado correctamente.',
    );
  }
}
