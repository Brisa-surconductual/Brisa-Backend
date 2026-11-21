import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  PENDIENTE_PERFIL,
  PerfilClinicoVigente,
  PerfilClinicoVigentePort,
} from '../../application/ports/perfil-clinico-vigente.port';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import {
  SinSesionConversacionalException,
  ValorClinicoInvalidoException,
} from '../../domain/exceptions/perfil-clinico-vigente.exceptions';

const tiposDependencia = [
  PENDIENTE_PERFIL,
  ...Object.values(TipoDependenciaClinica),
] as const;
const tiposCraving = [
  PENDIENTE_PERFIL,
  ...Object.values(TipoCravingClinico),
] as const;

interface FilaPerfilClinicoVigente {
  id_usuario: string;
  tipo_dependencia: string;
  tipo_craving: string;
  modalidad_terapeutica_activa: string | null;
  estado_perfil_clinico: PerfilClinicoVigente['estado_perfil_clinico'];
  fecha_clasificacion: Date | null;
  fuente_clasificacion: 'CHAT';
}

@Injectable()
export class PrismaPerfilClinicoVigenteAdapter implements PerfilClinicoVigentePort {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(idUsuario: string): Promise<PerfilClinicoVigente> {
    const [perfil] = await this.prisma.$queryRaw<FilaPerfilClinicoVigente[]>`
      SELECT id_usuario, tipo_dependencia, tipo_craving,
             modalidad_terapeutica_activa, estado_perfil_clinico,
             fecha_clasificacion, fuente_clasificacion
      FROM chat.v_perfil_clinico_vigente
      WHERE id_usuario = ${idUsuario}::uuid
    `;
    if (!perfil) throw new SinSesionConversacionalException();

    const dependencia = tiposDependencia.find(
      (valor) => String(valor) === perfil.tipo_dependencia,
    );
    const craving = tiposCraving.find(
      (valor) => String(valor) === perfil.tipo_craving,
    );
    const modalidad = Object.values(ModalidadConversacional).find(
      (valor) => String(valor) === perfil.modalidad_terapeutica_activa,
    );
    if (!dependencia || !craving || !modalidad) {
      throw new ValorClinicoInvalidoException();
    }

    return {
      ...perfil,
      tipo_dependencia: dependencia,
      tipo_craving: craving,
      modalidad_terapeutica_activa: modalidad,
    };
  }
}
