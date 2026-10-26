import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ContextoConversacionalRepository,
  PerfilClinicoConversacional,
} from '../../domain/repositories/contexto-conversacional.repository';

@Injectable()
export class PrismaContextoConversacionalRepository implements ContextoConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerModalidadVigente(
    idUsuario: string,
  ): Promise<ModalidadConversacional | null> {
    const tipoTerapia = await this.prisma.tipo_terapia.findFirst({
      where: {
        id_usuario: idUsuario,
        fecha_vigencia_hasta: null,
      },
      select: {
        modalidad: true,
      },
    });

    if (tipoTerapia === null) {
      return null;
    }

    return tipoTerapia.modalidad as ModalidadConversacional;
  }

  async obtenerPerfilClinico(
    idUsuario: string,
  ): Promise<PerfilClinicoConversacional | null> {
    const perfil = await this.prisma.perfil_clinico.findUnique({
      where: {
        id_usuario: idUsuario,
      },
      select: {
        tipo_dependencia: true,
        tipo_craving: true,
      },
    });

    if (perfil === null) {
      return null;
    }

    const tipoDependencia =
      perfil.tipo_dependencia as TipoDependenciaClinica | null;
    const tipoCraving = perfil.tipo_craving as TipoCravingClinico | null;

    return {
      tipoDependencia,
      tipoCraving,
      completo: tipoDependencia !== null && tipoCraving !== null,
    };
  }
}
