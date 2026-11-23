import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ModuloOrigenSos } from '../../../domain/enums/intervencion-sos.enum';

/** Tamaño máximo del estado opaco que el front guarda al oprimir el botón. */
export const MAX_BYTES_ESTADO_CONTEXTO_SOS = 16 * 1024;

/**
 * Ampliación B: lo que el estudiante estaba haciendo. El front lo llena solo;
 * el estudiante no escribe nada (RF-43, "sin fricción").
 */
export class ContextoOrigenSosDtoRequest {
  @IsEnum(ModuloOrigenSos)
  modulo!: ModuloOrigenSos;

  @IsString()
  @MaxLength(512)
  ruta!: string;

  /** Objeto opaco para el backend (borradores, paso, scroll, etc.). */
  @IsOptional()
  @IsObject()
  estado?: Record<string, unknown> | null;
}

/** RF-43: el body es opcional; vacío equivale al contrato original. */
export class ActivarSosDtoRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => ContextoOrigenSosDtoRequest)
  contexto_origen?: ContextoOrigenSosDtoRequest | null;
}
