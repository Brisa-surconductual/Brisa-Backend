import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

const CODIGO_PARTICIPANTE = /^[A-Za-z0-9-]+$/u;

export class AsignarParticipantesCohorteDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 16, { each: true })
  @Matches(CODIGO_PARTICIPANTE, { each: true })
  codigos_participante!: string[];
}

export class RetirarParticipanteCohorteParams {
  @IsUUID()
  id_cohorte!: string;

  @Length(1, 16)
  @Matches(CODIGO_PARTICIPANTE)
  codigo_participante!: string;
}
