import { Injectable } from '@nestjs/common';
import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { ConsultarPerfilArbolDtoRequest } from '../../dto/arbol-personalizado.dto-request';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25C / RF-26B: árbol personalizado publicado para una combinación de perfil
 * clínico, o `null` si no hay ninguno.
 */
@Injectable()
export class ConsultarPublicadoPersonalizadoUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: ConsultarPerfilArbolDtoRequest,
  ): Promise<FlujoConversacionalDtoResponse | null> {
    return ejecutarSeguro(async () => {
      FlujoConversacional.validarPerfil(dto.tipo_dependencia, dto.tipo_craving);
      const flujo = await this.repository.buscarPublicadoPersonalizado(
        dto.tipo_dependencia,
        dto.tipo_craving,
      );
      return flujo === null
        ? null
        : FlujoConversacionalDtoResponse.crear(flujo);
    });
  }
}
