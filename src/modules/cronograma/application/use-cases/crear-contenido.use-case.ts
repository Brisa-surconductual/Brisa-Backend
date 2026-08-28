import { Injectable } from '@nestjs/common';
import { Contenido } from '../../domain/entities/contenido.entity';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { ContenidoDtoResponse } from '../dto/contenido.dto-response';
import { CrearContenidoDtoRequest } from '../dto/crear-contenido.dto-request';

@Injectable()
export class CrearContenidoUseCase {
  constructor(private readonly contenidoRepository: ContenidoRepository) {}

  async execute(dto: CrearContenidoDtoRequest): Promise<ContenidoDtoResponse> {
    const contenido = Contenido.crear(dto.nombre_contenido, dto.tipo_contenido);
    const contenidoCreado = await this.contenidoRepository.crear(contenido);

    return ContenidoDtoResponse.crear(
      contenidoCreado,
      'Contenido psicoeducativo creado correctamente.',
    );
  }
}
