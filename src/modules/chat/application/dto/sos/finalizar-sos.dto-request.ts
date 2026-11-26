import { IsEnum } from 'class-validator';
import { MotivoFinalizacionSos } from '../../../domain/enums/intervencion-sos.enum';

export class FinalizarSosDtoRequest {
  @IsEnum(MotivoFinalizacionSos)
  motivo!: MotivoFinalizacionSos;
}
