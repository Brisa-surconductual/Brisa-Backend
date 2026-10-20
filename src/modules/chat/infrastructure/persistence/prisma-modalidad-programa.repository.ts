import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  AsignacionModalidadVigente,
  ModalidadProgramaRepository,
} from '../../domain/repositories/modalidad-programa.repository';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';

@Injectable()
export class PrismaModalidadProgramaRepository
  extends ModalidadProgramaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarAsignacionesVigentesPorPrograma(
    idPrograma: number,
  ): Promise<AsignacionModalidadVigente[]> {
    const asignaciones = await this.prisma.tipo_terapia.findMany({
      where: {
        id_programa: idPrograma,
        fecha_vigencia_hasta: null,
      },
      select: {
        id_usuario: true,
        modalidad: true,
        usuarios_tipo_terapia_id_usuarioTousuarios: {
          select: {
            rol: true,
            estado_cuenta: true,
            perfil_clinico: {
              select: {
                perfil_completo: true,
              },
            },
          },
        },
      },
    });

    return asignaciones.map((asignacion) => {
      const usuario =
        asignacion.usuarios_tipo_terapia_id_usuarioTousuarios;

      return {
        idUsuario: asignacion.id_usuario,
        modalidad: asignacion.modalidad as ModalidadConversacional,
        rol: usuario.rol as Rol,
        estadoCuenta: usuario.estado_cuenta as EstadoCuenta,
        perfilCompleto: usuario.perfil_clinico?.perfil_completo === true,
      };
    });
  }
}
