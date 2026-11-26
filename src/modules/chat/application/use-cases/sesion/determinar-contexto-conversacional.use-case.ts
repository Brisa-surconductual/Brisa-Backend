import { Injectable } from '@nestjs/common';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  ModalidadNoConfiguradaException,
  PerfilClinicoIncompletoException,
} from '../../../domain/exceptions';
import { ContextoConversacionalRepository } from '../../../domain/repositories/contexto-conversacional.repository';
import { ContextoConversacionalDtoResponse } from '../../dto/sesion-conversacional.dto-response';

/**
 * RF-24B: determina la modalidad terapéutica activa del usuario y, si es
 * personalizada, su perfil clínico (que debe estar completo).
 */
@Injectable()
export class DeterminarContextoConversacionalUseCase {
  constructor(private readonly repository: ContextoConversacionalRepository) {}

  async execute(idUsuario: string): Promise<ContextoConversacionalDtoResponse> {
    const modalidad = await this.repository.obtenerModalidadVigente(idUsuario);
    if (modalidad === null) {
      throw new ModalidadNoConfiguradaException();
    }

    if (modalidad === ModalidadConversacional.GRUPAL) {
      return ContextoConversacionalDtoResponse.grupal();
    }

    const perfil = await this.repository.obtenerPerfilClinico(idUsuario);
    if (
      perfil === null ||
      !perfil.completo ||
      perfil.tipoDependencia === null ||
      perfil.tipoCraving === null
    ) {
      throw new PerfilClinicoIncompletoException();
    }

    return ContextoConversacionalDtoResponse.personalizado(
      perfil.tipoDependencia,
      perfil.tipoCraving,
    );
  }
}
