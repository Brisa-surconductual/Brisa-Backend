import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';

export const CODIGO_PARTICIPANTE = /^[A-Z0-9-]+$/u;

export const normalizarCodigo = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

/** Body de `POST /admin/permisos-individuales` (RF-04). */
export class OtorgarPermisoIndividualDtoRequest {
  @Transform(normalizarCodigo)
  @IsString()
  @Length(1, 16)
  @Matches(CODIGO_PARTICIPANTE)
  codigo_participante!: string;

  @IsIn(Object.values(AlcancePermiso))
  alcance!: AlcancePermiso;

  @IsOptional()
  @IsDateString({ strict: true })
  fecha_fin_vigencia?: string | null;

  @IsUUID()
  id_usuario_beneficiario!: string;
}
