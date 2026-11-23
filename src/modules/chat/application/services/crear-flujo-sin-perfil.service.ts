import { Injectable } from '@nestjs/common';
import {
  FlujoConversacional,
  ModalidadSinPerfil,
} from '../../domain/entities/flujo/flujo-conversacional.entity';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from '../dto/arbol-conversacional.dto-response';

/**
 * RF-25 / RF-43: creación compartida de los flujos sin perfil clínico (GRUPAL
 * y SOS). Crea el borrador, lo guarda con su auditoría CREAR_FLUJO y lo
 * devuelve con el DTO de flujo de HU-03.
 */
@Injectable()
export class CrearFlujoSinPerfilService {
  constructor(private readonly repository: ArbolConversacionalRepository) {}

  async crear(
    modalidad: ModalidadSinPerfil,
    nombre: string,
    version: number,
    idActor: string,
  ): Promise<FlujoConversacionalDtoResponse> {
    const flujo = FlujoConversacional.crearSinPerfil(
      modalidad,
      nombre.trim(),
      version,
      idActor,
    );
    await this.repository.guardarFlujo(flujo, idActor);
    return FlujoConversacionalDtoResponse.crear(flujo);
  }
}
