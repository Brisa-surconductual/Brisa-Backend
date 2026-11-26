import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../../dto/arbol-conversacional.dto-response';
import { CrearFlujoSosDtoRequest } from '../../dto/sos/crear-flujo-sos.dto-request';
import { CrearFlujoSinPerfilService } from '../../services/crear-flujo-sin-perfil.service';
import { ejecutarSeguro } from '../../support/ejecutar-seguro';

/**
 * RF-43: crea un borrador del flujo SOS con la misma lógica que el grupal.
 * Recibe la siguiente versión SOS para poder preparar una versión nueva sin
 * clonar. Nodos, transiciones, publicación, clonación y archivado usan las
 * rutas de HU-03 / HU-05.
 */
@Injectable()
export class CrearFlujoSosUseCase {
  constructor(
    private readonly repository: ArbolConversacionalRepository,
    private readonly sinPerfil: CrearFlujoSinPerfilService,
  ) {}

  execute(
    dto: CrearFlujoSosDtoRequest,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    return ejecutarSeguro(async () => {
      const version =
        (await this.repository.obtenerUltimaVersionSinPerfil(
          ModalidadConversacional.SOS,
        )) + 1;
      return this.sinPerfil.crear(
        ModalidadConversacional.SOS,
        dto.nombre,
        version,
        idActor,
      );
    });
  }
}
