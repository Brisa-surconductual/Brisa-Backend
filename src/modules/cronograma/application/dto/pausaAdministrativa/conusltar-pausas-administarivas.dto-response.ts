import { IsDateString, IsEmail, IsEnum, IsString } from 'class-validator';
import { EstadoPausa } from '../../../domain/enums/estado-pausa.enum';
import { Transform } from 'class-transformer';

function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}

export class ConsultarPausasAdministrativasUsuarioDtoResponse {
  @IsString()
  idPausaAdministrativa: string;

  @IsString()
  idCronogramaUsuario: string;

  @IsEmail()
  correoElectronico: string;

  @IsString()
  idUsuario: string;

  @IsDateString()
  fechaInicio: string | Date;

  @Transform(toDateWithMidnight)
  fechaFin: Date;

  @IsString()
  motivo: string;

  @IsString()
  idUsuarioAdministrativo: string;

  @IsString()
  correoUsuarioAdministrativo: string;

  @Transform(toDateWithMidnight)
  fechaRegistro: Date;

  @IsEnum(EstadoPausa)
  estado: EstadoPausa;

  static response(pausa: any): ConsultarPausasAdministrativasUsuarioDtoResponse {
    const response = new ConsultarPausasAdministrativasUsuarioDtoResponse();
    response.idPausaAdministrativa = pausa.id_pausa;
    response.idCronogramaUsuario = pausa.id_cronograma_usuario;
    response.idUsuario = pausa.id_usuario;
    response.fechaInicio = pausa.fecha_inicio_pausa;
    response.fechaFin = pausa.fecha_fin_pausa;
    response.motivo = pausa.motivo_pausa;
    response.idUsuarioAdministrativo = pausa.id_usuario_administrativo;
    response.fechaRegistro = pausa.fecha_registro;
    response.estado = pausa.estado_pausa;
    response.correoElectronico = pausa.emailUsuario;
    response.correoUsuarioAdministrativo = pausa.correoUsuarioAdministrativo;
    return response;
  }

}