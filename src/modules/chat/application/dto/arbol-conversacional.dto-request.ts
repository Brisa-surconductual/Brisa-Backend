import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';

export class CrearNodoConversacionalDtoRequest {
  @IsUUID()
  id_tipo_nodo!: string;

  @IsObject()
  @IsNotEmptyObject()
  contenido!: Record<string, unknown>;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  es_nodo_inicial: boolean = false;

  @IsInt()
  @Min(1)
  orden!: number;

  @IsOptional()
  @IsUUID()
  id_contenido_cronograma?: string;
}

export class ActualizarNodoConversacionalDtoRequest {
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  id_tipo_nodo?: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsObject()
  @IsNotEmptyObject()
  contenido?: Record<string, unknown>;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  es_nodo_inicial?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number | null;

  @IsOptional()
  @IsUUID()
  id_contenido_cronograma?: string | null;
}

export class CrearFlujoGrupalDtoRequest {
  /** Esta solicitud solo crea flujos grupales. */
  @Equals(ModalidadConversacional.GRUPAL)
  modalidad: ModalidadConversacional.GRUPAL = ModalidadConversacional.GRUPAL;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  version: number = 1;
}
