import { BadRequestException, Injectable } from '@nestjs/common';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { ListarFlujosDtoRequest } from '../../dto/gestion-flujos.dto-request';
import { ListadoFlujosDtoResponse } from '../../dto/gestion-flujos.dto-response';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/** RF-25 / RF-25C: lista paginada de flujos, con filtros por modalidad, perfil y estado. */
@Injectable()
export class ListarFlujosUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(dto: ListarFlujosDtoRequest): Promise<ListadoFlujosDtoResponse> {
    if (!Number.isSafeInteger((dto.page - 1) * dto.page_size)) {
      throw new BadRequestException(
        'La paginación excede el rango de enteros admitido.',
      );
    }
    return ejecutarSeguro(async () => {
      const { items, total } = await this.repository.listarFlujos(
        {
          modalidad: dto.modalidad,
          tipoDependencia: dto.tipo_dependencia,
          tipoCraving: dto.tipo_craving,
          estado: dto.estado,
        },
        dto.page,
        dto.page_size,
      );
      return ListadoFlujosDtoResponse.crear(
        items,
        total,
        dto.page,
        dto.page_size,
      );
    });
  }
}
