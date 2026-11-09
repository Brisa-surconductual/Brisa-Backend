import { Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { PresentacionNodoActualDtoResponse } from '../dto/presentacion-nodo-actual.dto-response';
import { PresentacionNodoActualPort } from '../ports/presentacion-nodo-actual.port';
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
    const reglas = await this.lecturas.consultarReglas(
      nodo.idNodo,
      nodo.idFlujo,
    );
    const recursos =
      nodo.idContenidoCronograma === null
        ? []
        : await this.lecturas.consultarRecursos(nodo.idContenidoCronograma);
    return {
      idSesion: sesion.idSesion,
      estadoSesion: sesion.estadoActual,
      nodo: {
        idNodo: nodo.idNodo,
        tipoNodo: nodo.nombreTipoNodo,
        orden: nodo.orden,
        esTerminal: reglas.length === 0,
        bloques: await this.bloques.preparar(nodo.contenido, recursos),
        entrada: this.entrada.preparar(nodo.contenido, reglas),
      },
    };
  }
}
