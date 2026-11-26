import type { perfil_clinico } from '@prisma/client';
import { PerfilClinicoConversacional } from '../../domain/entities/perfil-clinico/perfil-clinico-conversacional';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export class PerfilClinicoConversacionalMapper {
  static toDomain(
    fila: Pick<perfil_clinico, 'tipo_dependencia' | 'tipo_craving'>,
  ): PerfilClinicoConversacional {
    return new PerfilClinicoConversacional(
      fila.tipo_dependencia as TipoDependenciaClinica | null,
      fila.tipo_craving as TipoCravingClinico | null,
    );
  }
}
