import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  ContextoOrigenSos,
  IntervencionSos,
} from '../../domain/entities/sos/intervencion-sos.entity';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
} from '../../domain/enums/intervencion-sos.enum';
import { TipoCravingClinico } from '../../domain/enums/perfil-clinico.enum';

export interface RecursoApoyo {
  nombre: string;
  telefono: string;
}

export interface NuevaIntervencionSos {
  idUsuario: string;
  idSesionSos: string;
  idSesionPausada: string | null;
  estadoSesionAnterior: EstadoSesionAnteriorSos;
  tipoCraving: TipoCravingClinico | null;
  contextoOrigen: ContextoOrigenSos | null;
}

/** Operaciones de RF-43 dentro de una única transacción. */
export interface IntervencionSosTransaccion {
  /** Serializa las activaciones del mismo estudiante. */
  bloquearUsuario(idUsuario: string): Promise<void>;
  buscarEnCurso(idUsuario: string): Promise<IntervencionSos | null>;
  bloquear(
    idIntervencion: string,
    idUsuario: string,
  ): Promise<IntervencionSos | null>;
  /** `chat.fn_cerrar_intervencion_sos`: cierre con reloj del servidor y evento. */
  cerrar(
    idIntervencion: string,
    estado: EstadoIntervencionSos,
  ): Promise<boolean>;
  /** Sesión de terapia pendiente (nunca una sesión SOS). */
  buscarSesionDeTerapiaPendiente(
    idUsuario: string,
  ): Promise<SesionConversacional | null>;
  /** Persiste la pausa con `motivo_pausa = SOS_CRAVING` y `fecha_pausa`. */
  pausarSesion(sesion: SesionConversacional): Promise<void>;
  crearSesionSos(sesion: SesionConversacional): Promise<void>;
  registrar(datos: NuevaIntervencionSos): Promise<IntervencionSos>;
}

export abstract class IntervencionSosPort {
  abstract ejecutar<T>(
    operacion: (tx: IntervencionSosTransaccion) => Promise<T>,
  ): Promise<T>;

  /** Líneas de ayuda activas, en orden. */
  abstract listarRecursosApoyo(): Promise<RecursoApoyo[]>;

  /** Cierra como EXPIRADA las intervenciones en curso vencidas. */
  abstract expirarVencidas(limite: number): Promise<number>;

  /** Ley 1581: borra el contexto de origen de las cerradas hace más de `horas`. */
  abstract purgarContextos(horas: number): Promise<number>;
}
