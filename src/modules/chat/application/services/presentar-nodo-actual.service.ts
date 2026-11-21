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

@Injectable()
export class PresentarNodoActualService {
  constructor(
    private readonly lecturas: PresentacionNodoActualPort,
    private readonly bloques: PresentarBloquesNodoActualService,
    private readonly entrada: PrepararEntradaNodoActualService,
  ) {}

  async preparar(
    sesion: SesionConversacional,
    nodo: NodoConversacional,
  ): Promise<PresentacionNodoActualDtoResponse> {
    const [tieneSalidas, contenido] = await Promise.all([
      this.lecturas.tieneSalidas(nodo.idNodo, nodo.idFlujo),
      this.presentarContenido(nodo),
    ]);
    return {
      idSesion: sesion.idSesion,
      estadoSesion: sesion.estadoActual,
      nodo: {
        idNodo: nodo.idNodo,
        tipoNodo: nodo.nombreTipoNodo,
        orden: nodo.orden,
        esTerminal: !tieneSalidas,
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
      nodo.idContenidoCronograma === null
        ? []
        : await this.lecturas
            .consultarRecursos(nodo.idContenidoCronograma)
            .catch(() => {
              throw new RecursoConversacionalNoDisponibleException();
            });
    return {
      bloques: await this.bloques.preparar(nodo.contenido, recursos),
      entrada: this.entrada.preparar(nodo.contenido),
    };
  }
}
