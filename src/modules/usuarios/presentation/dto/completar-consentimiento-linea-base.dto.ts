import { Type } from 'class-transformer';
import { IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { LineaBaseDto } from './linea-base.dto';

export class CompletarConsentimientoLineaBaseDto {
  @IsUUID()
  idConsentimiento!: string;

  @IsBoolean()
  consentimientoAceptado!: boolean;

  @IsBoolean()
  registroConsumoAutorizado!: boolean;

  @ValidateNested()
  @Type(() => LineaBaseDto)
  lineaBase!: LineaBaseDto;
}
