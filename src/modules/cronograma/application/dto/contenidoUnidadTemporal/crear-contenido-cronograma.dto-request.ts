import { Transform } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';


function toDateWithMidnight({ value }: { value: unknown }): Date | undefined {
  if (typeof value !== 'string') return undefined;

  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(soloFecha ? `${value}T00:00:00.000Z` : value);
}


export class crearContenidoCronogramaDtoRequest {
    @IsString()
    idContenido!: string;

    @IsString()
    idUnidadTemporal!: string;

    @Transform(toDateWithMidnight)
    @IsDate()
    fechaInicioDisponibilidad!: Date;

    @Transform(toDateWithMidnight)
    @IsDate()
    fechaFinDisponibilidad!: Date;

}