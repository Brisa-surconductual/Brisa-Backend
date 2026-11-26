import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import {
  BloqueNodoDtoResponse,
  EntradaNodoDtoResponse,
  PresentacionNodoActualDtoResponse,
} from '../dto/presentacion-nodo-actual.dto-response';
import { PresentacionNodoActualPort } from '../ports/presentacion-nodo-actual.port';
import { RecursoConversacionalNoDisponibleException } from '../exceptions/recurso-conversacional-no-disponible.exception';
import { PresentarBloquesNodoActualService } from './presentar-bloques-nodo-actual.service';
import { PrepararEntradaNodoActualService } from './preparar-entrada-nodo-actual.service';
import { HabilitacionNodoService } from './habilitacion-nodo.service';

@Injectable()
export class PresentarNodoActualService {
  constructor(
    private readonly lecturas: PresentacionNodoActualPort,
    private readonly bloques: PresentarBloquesNodoActualService,
    private readonly entrada: PrepararEntradaNodoActualService,
    private readonly habilitacion: HabilitacionNodoService,
  ) {}

  async preparar(
    sesion: SesionConversacional,
    nodo: NodoConversacional,
  ): Promise<PresentacionNodoActualDtoResponse> {
    const [esTerminal, disponibilidad] = await Promise.all([
      this.lecturas.esTerminal(nodo.idNodo, nodo.idFlujo),
      this.habilitacion.evaluar(sesion.idUsuario, nodo),
    ]);
    // RF-24/RF-22: un nodo en espera del cronograma no expone su contenido
    // (ni URL firmadas) ni su formulario antes de tiempo.
    const contenido = disponibilidad.habilitado
      ? await this.presentarContenido(nodo)
      : { bloques: [], entrada: null };
    return {
      idSesion: sesion.idSesion,
      estadoSesion: sesion.estadoActual,
      nodo: {
        idNodo: nodo.idNodo,
        tipoNodo: nodo.nombreTipoNodo,
        orden: nodo.orden,
        esTerminal,
        disponibilidad: {
          habilitado: disponibilidad.habilitado,
          habilitaAprox: disponibilidad.habilitaAprox?.toISOString() ?? null,
        },
        bloques: contenido.bloques,
        entrada: contenido.entrada,
      },
    };
  }

  /**
   * Bloques (con URL firmadas nuevas) y entrada de un nodo. Lo reutiliza el
   * historial (RF-32) para presentar los nodos ya recorridos igual que RF-26.
   */
  async presentarContenido(nodo: NodoConversacional): Promise<{
    bloques: BloqueNodoDtoResponse[];
    entrada: EntradaNodoDtoResponse | null;
  }> {
    const recursos =
      nodo.idContenido === null
        ? []
        : await this.lecturas.consultarRecursos(nodo.idContenido).catch(() => {
            throw new RecursoConversacionalNoDisponibleException();
          });
    return {
      bloques: await this.bloques.preparar(nodo.contenido, recursos),
      entrada: this.entrada.preparar(nodo.contenido),
    };
  }
}
