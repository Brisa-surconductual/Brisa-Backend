import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { DecisionRespuesta } from '../../domain/policies/motor-respuesta-conversacional.policy';
import { CapturaPerfilRespuesta } from '../../domain/policies/captura-perfil-respuesta.policy';
import { ResultadoRespuesta } from '../dto/procesar-respuesta.dto-response';

export interface SolicitudRespuesta {
  idSesion: string;
  idUsuario: string;
  idNodo: string;
  idRespuesta: string;
  fechaCaptura: Date;
}
export interface RegistroDeRespuesta {
  solicitud: SolicitudRespuesta;
  decision: DecisionRespuesta;
  resultado: ResultadoRespuesta;
  ahora: Date;
}
export interface ContextoRespuestaTransaccion {
  bloquearSesion(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;
  buscarNodo(idNodo: string): Promise<NodoConversacional | null>;
  buscarTransiciones(idNodo: string): Promise<TransicionConversacional[]>;
  tieneSalidas(idNodo: string, idFlujo: string): Promise<boolean>;
}
export interface RegistroRespuestaTransaccion {
  buscarResultado(
    idRespuesta: string,
  ): Promise<{ idSesion: string; resultado: unknown } | null>;
  guardar(registro: RegistroDeRespuesta): Promise<void>;
}
export interface PerfilRespuestaTransaccion {
  guardar(
    idUsuario: string,
    captura: CapturaPerfilRespuesta,
    fechaCaptura: Date,
    ahora: Date,
  ): Promise<void>;
}
export interface TransaccionRespuesta {
  contexto: ContextoRespuestaTransaccion;
  registro: RegistroRespuestaTransaccion;
  perfil: PerfilRespuestaTransaccion;
}

/** Aplicación coordina el negocio; el adaptador asegura una única transacción. */
export abstract class ProcesarRespuestaPort {
  abstract ejecutar<T>(
    operacion: (tx: TransaccionRespuesta) => Promise<T>,
  ): Promise<T>;
}
export abstract class ComprobarFormatoRespuestaPort {
  abstract coincide(patron: string, texto: string): boolean;
}
export type { ResultadoRespuesta } from '../dto/procesar-respuesta.dto-response';
