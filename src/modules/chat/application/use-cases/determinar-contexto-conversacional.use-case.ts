import { Injectable } from '@nestjs/common';
import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ModalidadNoConfiguradaException,
  PerfilClinicoIncompletoException,
} from '../../domain/exeption/contexto-conversacional.exceptions';
import { ContextoConversacionalRepository } from '../../domain/repositories/contexto-conversacional.repository';

export interface ContextoConversacional {
  modalidad: ModalidadConversacional;
  perfil: {
    tipoDependencia: TipoDependenciaClinica;
    tipoCraving: TipoCravingClinico;
  } | null;
}

@Injectable()
export class DeterminarContextoConversacionalUseCase {
  constructor(private readonly repository: ContextoConversacionalRepository) {}

  async execute(idUsuario: string): Promise<ContextoConversacional> {
    const modalidad = await this.repository.obtenerModalidadVigente(idUsuario);

    if (modalidad === null) {
      throw new ModalidadNoConfiguradaException();
    }

    if (modalidad === ModalidadConversacional.GRUPAL) {
      return {
        modalidad,
        perfil: null,
      };
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

    return {
      modalidad,
      perfil: {
        tipoDependencia: perfil.tipoDependencia,
        tipoCraving: perfil.tipoCraving,
      },
    };
  }
}
