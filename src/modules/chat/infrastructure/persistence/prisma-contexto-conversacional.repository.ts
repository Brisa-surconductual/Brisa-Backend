import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PerfilClinicoConversacional } from '../../domain/entities/perfil-clinico/perfil-clinico-conversacional';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { ContextoConversacionalRepository } from '../../domain/repositories/contexto-conversacional.repository';
import { PerfilClinicoConversacionalMapper } from '../mappers/perfil-clinico-conversacional.mapper';

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

    return perfil === null
      ? null
      : PerfilClinicoConversacionalMapper.toDomain(perfil);
  }
}
