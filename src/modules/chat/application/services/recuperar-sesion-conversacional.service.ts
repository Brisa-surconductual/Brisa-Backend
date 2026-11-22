import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  EstadoSesionInconsistenteException,
  SesionErrorConfiguracionException,
} from '../../domain/exceptions/sesion.exceptions';
import { PaginaHistorialInteracciones } from '../../domain/repositories/historial-interacciones.repository';
import { LIMITE_HISTORIAL_INTERACCIONES } from '../dto/historial-interacciones.dto-request';
import { RecuperarSesionConversacionalPort } from '../ports/recuperar-sesion-conversacional.port';

export interface EstadoSesionRecuperado {
  sesion: SesionConversacional;
  nodo: NodoConversacional;
  historial: PaginaHistorialInteracciones;
  recuperadaDesdeHistorial: boolean;
}

@Injectable()
export class RecuperarSesionConversacionalService {
  constructor(
    private readonly persistencia: RecuperarSesionConversacionalPort,
  ) {}

  recuperar(
    idSesion: string,
    idUsuario: string,
  ): Promise<EstadoSesionRecuperado | null>;
  recuperar<T>(
    idSesion: string,
    idUsuario: string,
    finalizar: (estado: EstadoSesionRecuperado) => Promise<T>,
  ): Promise<T | null>;
  recuperar<T>(
    idSesion: string,
    idUsuario: string,
    finalizar?: (estado: EstadoSesionRecuperado) => Promise<T>,
  ): Promise<EstadoSesionRecuperado | T | null> {
    return this.persistencia.ejecutar(async (tx) => {
      const anterior = await tx.bloquearSesion(idSesion, idUsuario);
      if (anterior === null) throw new EstadoSesionInconsistenteException();
      if (anterior.tieneErrorConfiguracion)
        throw new SesionErrorConfiguracionException();
      if (anterior.estadoActual === 'COMPLETADA') return null;
      if (
        anterior.idFlujoConversacional === null ||
        anterior.versionArbolUtilizada === null
      )
        throw new EstadoSesionInconsistenteException();

      const destinoRegistrado = await tx.buscarUltimoDestino(anterior);
      const idNodo = destinoRegistrado ?? anterior.idNodoActual;
      const nodo = idNodo === null ? null : await tx.buscarNodo(idNodo);
      if (nodo === null || nodo.idFlujo !== anterior.idFlujoConversacional)
        throw new EstadoSesionInconsistenteException();

      const sesion = anterior.reanudar(nodo.idNodo);
      if (sesion !== anterior) await tx.guardarReanudacion(sesion, anterior);
      const historial = await tx.consultarHistorial({
        idSesion,
        antesDe: null,
        limite: LIMITE_HISTORIAL_INTERACCIONES,
      });
      if (historial === null) throw new EstadoSesionInconsistenteException();

      const estado = {
        sesion,
        nodo,
        historial,
        recuperadaDesdeHistorial: anterior.idNodoActual !== nodo.idNodo,
      };
      return finalizar === undefined ? estado : finalizar(estado);
    });
  }

  /**
   * Lee una sesión COMPLETADA posicionada en su nodo final, con su historial
   * reciente. No la reanuda ni modifica su estado. Devuelve null si la sesión
   * no está completada.
   */
  consultarCompletada<T>(
    idSesion: string,
    idUsuario: string,
    finalizar: (estado: EstadoSesionRecuperado) => Promise<T>,
  ): Promise<T | null> {
    return this.persistencia.ejecutar(async (tx) => {
      const sesion = await tx.bloquearSesion(idSesion, idUsuario);
      if (sesion === null) throw new EstadoSesionInconsistenteException();
      if (!sesion.estaCompletada) return null;
      if (
        sesion.idFlujoConversacional === null ||
        sesion.versionArbolUtilizada === null ||
        sesion.idNodoActual === null
      )
        throw new EstadoSesionInconsistenteException();

      const nodo = await tx.buscarNodo(sesion.idNodoActual);
      if (nodo === null || nodo.idFlujo !== sesion.idFlujoConversacional)
        throw new EstadoSesionInconsistenteException();

      const historial = await tx.consultarHistorial({
        idSesion,
        antesDe: null,
        limite: LIMITE_HISTORIAL_INTERACCIONES,
      });
      if (historial === null) throw new EstadoSesionInconsistenteException();

      return finalizar({
        sesion,
        nodo,
        historial,
        recuperadaDesdeHistorial: false,
      });
    });
  }
}
