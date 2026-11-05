import { BadRequestException, Injectable } from '@nestjs/common';
import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { CrearFlujoConversacionalDtoRequest } from '../../dto/chat-admin.dto-request';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-25 / RF-25C: crea un flujo en borrador. El grupal nace en versión 1; el
 * personalizado recibe la siguiente versión de su combinación de perfil clínico.
 */
@Injectable()
export class CrearFlujoConversacionalUseCase {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  execute(
    dto: CrearFlujoConversacionalDtoRequest,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const nombre = dto.nombre.trim();

      if (dto.modalidad === ModalidadConversacional.GRUPAL) {
        if (dto.tipo_dependencia != null || dto.tipo_craving != null) {
          throw new BadRequestException(
            'El perfil clínico solo aplica a la modalidad PERSONALIZADA.',
          );
        }
        const grupal = FlujoConversacional.crearGrupal(nombre, 1, idActor);
        await this.repository.guardarFlujo(grupal, idActor);
        return FlujoConversacionalDtoResponse.crear(grupal);
      }

      FlujoConversacional.validarPerfil(dto.tipo_dependencia, dto.tipo_craving);
      const version =
        (await this.repository.obtenerUltimaVersionPersonalizada(
          dto.tipo_dependencia!,
          dto.tipo_craving!,
        )) + 1;
      const personalizado = FlujoConversacional.crearPersonalizado(
        nombre,
        dto.tipo_dependencia!,
        dto.tipo_craving!,
        version,
        idActor,
      );
      await this.repository.guardarFlujo(personalizado, idActor);
      return FlujoConversacionalDtoResponse.crear(personalizado);
    });
  }
}
