import { IsBoolean, IsUUID } from 'class-validator';

export class ReaceptarConsentimientoDto {
  @IsUUID()
  idConsentimiento!: string;

  @IsBoolean()
  consentimientoAceptado!: boolean;

  @IsBoolean()
  registroConsumoAutorizado!: boolean;
}
