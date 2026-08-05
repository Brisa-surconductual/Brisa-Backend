import { Sesion } from '../../domain/entities/sesiones.entity';
import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

export class SesionMapper {
  static toDomain(sesion: {
    id_sesion: string;
    id_usuario: string;
    token_hash: string | null;
    csrf_token_hash: string | null;
    alcance_sesion: string;
    fecha_inicio_sesion: Date;
    fecha_ultima_interaccion: Date;
    limite_inactividad_minutos: number;
    estado_aplicacion: string;
    activa: boolean;
    fecha_cierre_sesion: Date | null;
    motivo_cierre: string | null;
  }): Sesion {
    return new Sesion(
      sesion.id_sesion,
      sesion.id_usuario,
      sesion.token_hash,
      sesion.csrf_token_hash,
      this.alcanceSesionToDomain(sesion.alcance_sesion),
      sesion.fecha_inicio_sesion,
      sesion.fecha_ultima_interaccion,
      sesion.limite_inactividad_minutos,
      this.estadoAplicacionToDomain(sesion.estado_aplicacion),
      sesion.activa,
      sesion.fecha_cierre_sesion,
      this.motivoCierreToDomain(sesion.motivo_cierre),
    );
  }

  static toPrisma(sesion: Sesion) {
    return {
      id_sesion: sesion.id_sesion,
      id_usuario: sesion.id_usuario,
      token_hash: sesion.token_hash,
      csrf_token_hash: sesion.csrf_token_hash,
      alcance_sesion: sesion.alcance_sesion,
      fecha_inicio_sesion: sesion.fecha_inicio_sesion,
      fecha_ultima_interaccion: sesion.fecha_ultima_interaccion,
      limite_inactividad_minutos: sesion.limite_inactividad_minutos,
      estado_aplicacion: this.estadoAplicacionToPrisma(
        sesion.estado_aplicacion,
      ),
      activa: sesion.activa,
      fecha_cierre_sesion: sesion.fecha_cierre_sesion,
      motivo_cierre: this.motivoCierreToPrisma(sesion.motivo_cierre_sesion),
    };
  }

  static estadoAplicacionToPrisma(estado: EstadoAplicacion): string {
    return estado === EstadoAplicacion.SEGUNDO_PLANO
      ? 'SEGUNDO_PLANO'
      : 'ACTIVA';
  }

  static motivoCierreToPrisma(motivo: MotivoCierre | null): string | null {
    if (motivo === null) return null;
    if (motivo === MotivoCierre.INACTIVIDAD) return 'INACTIVIDAD';
    if (motivo === MotivoCierre.SEGUNDO_PLANO) return 'SEGUNDO_PLANO';
    return 'VOLUNTARIO';
  }

  private static estadoAplicacionToDomain(estado: string): EstadoAplicacion {
    return estado === 'SEGUNDO_PLANO'
      ? EstadoAplicacion.SEGUNDO_PLANO
      : EstadoAplicacion.ACTIVA;
  }

  private static alcanceSesionToDomain(alcance: string): AlcanceSesion {
    return alcance === 'COMPLETA'
      ? AlcanceSesion.COMPLETA
      : AlcanceSesion.LIMITADA;
  }

  private static motivoCierreToDomain(
    motivo: string | null,
  ): MotivoCierre | null {
    if (motivo === null) return null;
    if (motivo === 'INACTIVIDAD') return MotivoCierre.INACTIVIDAD;
    if (motivo === 'SEGUNDO_PLANO') return MotivoCierre.SEGUNDO_PLANO;
    return MotivoCierre.VOLUNTARIO;
  }
}
