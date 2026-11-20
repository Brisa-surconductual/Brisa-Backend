import { HttpException, Injectable } from '@nestjs/common';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { tipoEntradaConfigurado } from '../../../domain/enums/tipo-entrada-respuesta.enum';
import {
  DomainException,
  SesionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import {
  HistorialInteraccionesRepository,
  InteraccionRegistrada,
} from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { ConsultarHistorialInteraccionesDtoRequest } from '../../dto/historial-interacciones.dto-request';
import {
  HistorialInteraccionesDtoResponse,
  InteraccionHistorialDtoResponse,
} from '../../dto/historial-interacciones.dto-response';
import { ContenidoNodoNoDisponibleException } from '../../exceptions/contenido-nodo-no-disponible.exception';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';

type ContenidoPresentado = Awaited<
  ReturnType<PresentarNodoActualService['presentarContenido']>
>;

/**
 * RF-31 / RF-32: historial reciente de una sesión del estudiante, paginado
 * hacia atrás. Solo lectura: no inicia, reanuda ni avanza la sesión.
 */
@Injectable()
export class ConsultarHistorialInteraccionesUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly arboles: ArbolConversacionalRepository,
    private readonly historial: HistorialInteraccionesRepository,
    private readonly presentacion: PresentarNodoActualService,
  ) {}

  async execute(
    idSesion: string,
    idUsuario: string,
    consulta: ConsultarHistorialInteraccionesDtoRequest,
  ): Promise<HistorialInteraccionesDtoResponse> {
    try {
      // RF-26: una sesión de otro usuario se trata como inexistente.
      const sesion = await this.sesiones.buscarPorIdYUsuario(
        idSesion,
        idUsuario,
      );
      if (sesion === null)
        throw new SesionConversacionalNoEncontradaException();

      const pagina = await this.historial.consultar({
        idSesion: sesion.idSesion,
        antesDe: consulta.antes_de ?? null,
        limite: consulta.limite,
      });

      const contenidos = await this.presentarNodos(
        pagina.interacciones,
        sesion.idFlujoConversacional,
      );

      return {
        data: {
          id_sesion: sesion.idSesion,
          ultima_secuencia: pagina.ultimaSecuencia,
          hay_mas: pagina.hayMas,
          interacciones: pagina.interacciones.map((i) =>
            this.presentarInteraccion(i, contenidos),
          ),
        },
      };
    } catch (error: unknown) {
      if (error instanceof DomainException || error instanceof HttpException)
        throw error;
      throw new ContenidoNodoNoDisponibleException();
    }
  }

  /** Cada nodo se lee y firma una sola vez aunque se repita en la página. */
  private async presentarNodos(
    interacciones: InteraccionRegistrada[],
    idFlujo: string | null,
  ): Promise<Map<string, ContenidoPresentado>> {
    const ids = [...new Set(interacciones.map((i) => i.idNodo))];
    const presentados = await Promise.all(
      ids.map(async (id) => {
        const nodo = await this.arboles.buscarNodo(id);
        return [id, await this.presentar(nodo, idFlujo)] as const;
      }),
    );
    return new Map(presentados);
  }

  private async presentar(
    nodo: NodoConversacional | null,
    idFlujo: string | null,
  ): Promise<ContenidoPresentado> {
    // RF-31: el historial solo contiene nodos del flujo de la sesión.
    if (nodo === null || nodo.idFlujo !== idFlujo || nodo.contenido == null)
      throw new ContenidoNodoNoDisponibleException();
    return this.presentacion.presentarContenido(nodo);
  }

  private presentarInteraccion(
    i: InteraccionRegistrada,
    contenidos: Map<string, ContenidoPresentado>,
  ): InteraccionHistorialDtoResponse {
    const contenido = contenidos.get(i.idNodo);
    if (contenido === undefined) throw new ContenidoNodoNoDisponibleException();
    return {
      id_interaccion: i.idInteraccion,
      secuencia: i.secuencia,
      timestamp_interaccion: i.timestampInteraccion.toISOString(),
      registrada_en: i.registradaEn.toISOString(),
      nodo: {
        idNodo: i.idNodo,
        bloques: contenido.bloques,
        entrada: contenido.entrada,
      },
      // RF-27: el valor se devuelve tal como se capturó.
      respuesta: {
        tipo_entrada: tipoEntradaConfigurado(i.tipoEntrada) ?? i.tipoEntrada,
        valor: i.valor,
      },
    };
  }
}
