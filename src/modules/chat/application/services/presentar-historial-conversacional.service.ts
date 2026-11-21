import { Injectable } from '@nestjs/common';
import {
  TipoEntradaRespuesta,
  tipoEntradaConfigurado,
} from '../../domain/enums/tipo-entrada-respuesta.enum';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  InteraccionRegistrada,
  PaginaHistorialInteracciones,
} from '../../domain/repositories/historial-interacciones.repository';
import {
  HistorialInteraccionesDtoResponse,
  InteraccionHistorialDtoResponse,
} from '../dto/historial-interacciones.dto-response';
import { ContenidoNodoNoDisponibleException } from '../exceptions/contenido-nodo-no-disponible.exception';
import { HistorialConversacionalInconsistenteException } from '../exceptions/historial-conversacional-inconsistente.exception';
import { PresentarNodoActualService } from './presentar-nodo-actual.service';

type ContenidoPresentado = { tipoNodo: string } & Awaited<
  ReturnType<PresentarNodoActualService['presentarContenido']>
>;

@Injectable()
export class PresentarHistorialConversacionalService {
  constructor(
    private readonly arboles: ArbolConversacionalRepository,
    private readonly presentacion: PresentarNodoActualService,
  ) {}

  async presentar(
    pagina: PaginaHistorialInteracciones,
    idFlujo: string | null,
  ): Promise<HistorialInteraccionesDtoResponse['data']> {
    const ids = [
      ...new Set(pagina.interacciones.map((interaccion) => interaccion.idNodo)),
    ];
    const nodos =
      ids.length === 0 ? [] : await this.arboles.buscarNodosPorIds(ids);
    if (
      nodos.length !== ids.length ||
      nodos.some((nodo) => nodo.idFlujo !== idFlujo)
    )
      throw new HistorialConversacionalInconsistenteException();
    const contenidos = new Map(
      await Promise.all(
        nodos.map(async (nodo) => {
          if (nodo.contenido == null)
            throw new ContenidoNodoNoDisponibleException();
          return [
            nodo.idNodo,
            {
              tipoNodo: nodo.nombreTipoNodo,
              ...(await this.presentacion.presentarContenido(nodo)),
            },
          ] as const;
        }),
      ),
    );
    const items = pagina.interacciones.map((interaccion) =>
      this.presentarInteraccion(
        interaccion,
        contenidos.get(interaccion.idNodo),
      ),
    );
    return {
      items,
      hay_mas: pagina.hayMas,
      siguiente_cursor: pagina.hayMas ? items[0].secuencia : null,
    };
  }

  private presentarInteraccion(
    i: InteraccionRegistrada,
    contenido: ContenidoPresentado | undefined,
  ): InteraccionHistorialDtoResponse {
    if (contenido === undefined)
      throw new HistorialConversacionalInconsistenteException();
    const tipoCanonico = tipoEntradaConfigurado(i.tipoEntrada);
    const etiqueta =
      tipoCanonico === TipoEntradaRespuesta.OPCION_UNICA
        ? (contenido.entrada?.opciones?.find(
            (opcion) => opcion.valor === i.valor,
          )?.etiqueta ?? null)
        : null;
    return {
      id_interaccion: i.idInteraccion,
      secuencia: i.secuencia,
      timestamp_interaccion: i.timestampInteraccion.toISOString(),
      nodo: {
        id_nodo: i.idNodo,
        tipo_nodo: contenido.tipoNodo,
        bloques: contenido.bloques,
      },
      respuesta: {
        tipo_entrada: tipoCanonico ?? i.tipoEntrada,
        valor: i.valor,
        etiqueta,
      },
      id_nodo_destino: i.idNodoDestino,
    };
  }
}
