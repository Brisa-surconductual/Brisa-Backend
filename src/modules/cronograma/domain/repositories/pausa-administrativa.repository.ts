import { PausaAdministrativa } from '../entities/pausa-administrativa.entity';

export interface ContextoCronogramaActivoUsuario {
  idCronogramaUsuario: string;
  fechaInicioUsuario: Date;
  fechaFinUsuario: Date;
}

export abstract class PausaAdministrativaRepository {
  abstract buscarContextoCronogramaActivo(
    idUsuario: string,
  ): Promise<ContextoCronogramaActivoUsuario | null>;

  abstract existeSolapamiento(
    idCronogramaUsuario: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean>;

  abstract crear(pausa: PausaAdministrativa): Promise<PausaAdministrativa>;

  abstract listarPorUsuario(
    idUsuario: string,
    fechaConsulta: Date,
  ): Promise<PausaAdministrativa[]>;

  abstract anular(
    idUsuario: string,
    idPausa: string,
  ): Promise<PausaAdministrativa | null>;
}
