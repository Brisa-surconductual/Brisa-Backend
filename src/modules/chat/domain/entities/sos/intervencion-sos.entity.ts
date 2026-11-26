import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
  ModuloOrigenSos,
  MotivoFinalizacionSos,
} from '../../enums/intervencion-sos.enum';
import { TipoCravingClinico } from '../../enums/perfil-clinico.enum';

/** Ampliación B: lo que el estudiante hacía al oprimir el botón (opaco). */
export interface ContextoOrigenSos {
  modulo: ModuloOrigenSos;
  ruta: string;
  estado: Record<string, unknown> | null;
}

/**
 * RF-43: una activación del protocolo SOS. Las fechas vienen del reloj de
 * PostgreSQL; `vencida` también se calcula allí, no en el proceso Node.
 */
export class IntervencionSos {
  constructor(
    readonly idIntervencion: string,
    readonly idUsuario: string,
    readonly idSesionSos: string,
    readonly idSesionPausada: string | null,
    readonly estadoSesionAnterior: EstadoSesionAnteriorSos,
    readonly tipoCraving: TipoCravingClinico | null,
    readonly estado: EstadoIntervencionSos,
    readonly contextoOrigen: ContextoOrigenSos | null,
    readonly inicioServidor: Date,
    readonly finMaximoServidor: Date,
    readonly duracionSegundos: number | null,
    readonly vencida: boolean,
  ) {}

  get estaEnCurso(): boolean {
    return this.estado === EstadoIntervencionSos.EN_CURSO;
  }

  /** En curso y dentro de los 60 s medidos por el servidor. */
  get estaVigente(): boolean {
    return this.estaEnCurso && !this.vencida;
  }

  /**
   * Estado solicitado al cerrar. La función SQL de cierre lo ajusta con el
   * reloj del servidor (EXPIRADA) y con el estado real de la sesión SOS
   * (COMPLETA solo si llegó al nodo final).
   */
  static estadoPorMotivo(motivo: MotivoFinalizacionSos): EstadoIntervencionSos {
    switch (motivo) {
      case MotivoFinalizacionSos.COMPLETADA:
        return EstadoIntervencionSos.COMPLETA;
      case MotivoFinalizacionSos.CERRADA_POR_USUARIO:
        return EstadoIntervencionSos.INCOMPLETA;
      case MotivoFinalizacionSos.TIEMPO_AGOTADO:
        return EstadoIntervencionSos.EXPIRADA;
    }
  }
}
