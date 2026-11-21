import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  ConsultaHistorialInteracciones,
  PaginaHistorialInteracciones,
} from '../../domain/repositories/historial-interacciones.repository';

export interface RecuperarSesionTransaccion {
  bloquearSesion(
    idSesion: string,
    idUsuario: string,
  ): Promise<SesionConversacional | null>;
  buscarNodo(idNodo: string): Promise<NodoConversacional | null>;
  buscarUltimoDestino(sesion: SesionConversacional): Promise<string | null>;
  guardarReanudacion(
    sesion: SesionConversacional,
    anterior: SesionConversacional,
  ): Promise<void>;
  consultarHistorial(
    consulta: ConsultaHistorialInteracciones,
  ): Promise<PaginaHistorialInteracciones | null>;
}

export abstract class RecuperarSesionConversacionalPort {
  abstract ejecutar<T>(
    operacion: (tx: RecuperarSesionTransaccion) => Promise<T>,
  ): Promise<T>;
}
