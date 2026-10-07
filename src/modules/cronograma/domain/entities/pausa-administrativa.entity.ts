import { randomUUID } from 'crypto';
import { EstadoPausa } from '../enums/estado-pausa.enum';

export class PausaAdministrativa {
  constructor(
    readonly id_pausa: string,
    readonly id_usuario: string,
    readonly id_cronograma_usuario: string,
    readonly fecha_inicio_pausa: Date,
    readonly fecha_fin_pausa: Date,
    readonly motivo_pausa: string,
    readonly id_usuario_administrativo: string,
    readonly fecha_registro: Date,
    readonly estado_pausa: EstadoPausa,
  ) {}

  static registrar(datos: {
    idUsuario: string;
    idCronogramaUsuario: string;
    fechaInicio: Date;
    fechaFin: Date;
    motivo: string;
    idUsuarioAdministrativo: string;
    fechaRegistro?: Date;
  }): PausaAdministrativa {
    return new PausaAdministrativa(
      randomUUID(),
      datos.idUsuario,
      datos.idCronogramaUsuario,
      datos.fechaInicio,
      datos.fechaFin,
      datos.motivo.trim(),
      datos.idUsuarioAdministrativo,
      datos.fechaRegistro ?? new Date(),
      EstadoPausa.ACTIVA,
    );
  }
}
