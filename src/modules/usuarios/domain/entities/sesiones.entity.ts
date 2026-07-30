import { MotivoCierre } from '../enums/motivo-cierre-enum';
import { EstadoAplicacion } from '../enums/estado-aplicacion-enum';

export class Sesion {
  constructor(
    private readonly id_sesion: string,
    private id_usuario: string,
    private fecha_inicio_sesion: Date,
    private fecha_ultima_interaccion: Date,
    private limite_inactividad_minutos: number,
    private estado_aplicacion: EstadoAplicacion,
    private activa: boolean,
    private fecha_cierre_sesion: Date,
    private motivo_cierre_sesion: MotivoCierre,
  ) {}
}
