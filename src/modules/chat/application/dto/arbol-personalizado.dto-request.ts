import {
  Allow,
  Equals,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export class CrearArbolPersonalizadoDtoRequest {
  /** Esta solicitud solo crea flujos personalizados. */
  @Equals(ModalidadConversacional.PERSONALIZADA)
  modalidad: ModalidadConversacional.PERSONALIZADA =
    ModalidadConversacional.PERSONALIZADA;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @Allow()
  tipo_dependencia!: TipoDependenciaClinica;

  @Allow()
  tipo_craving!: TipoCravingClinico;
}

export class ConsultarPerfilArbolDtoRequest {
  @Allow()
  tipo_dependencia!: TipoDependenciaClinica;

  @Allow()
  tipo_craving!: TipoCravingClinico;
}
