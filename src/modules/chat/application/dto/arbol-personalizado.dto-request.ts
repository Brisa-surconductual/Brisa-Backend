import { Allow, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';

export class CrearArbolPersonalizadoDtoRequest {
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
