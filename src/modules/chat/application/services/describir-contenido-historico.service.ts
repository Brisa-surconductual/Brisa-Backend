import { Injectable } from '@nestjs/common';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import {
  TipoEntradaRespuesta,
  tipoEntradaConfigurado,
} from '../../domain/enums/tipo-entrada-respuesta.enum';
import { BloquesNodoActual } from '../../domain/policies/bloques-nodo-actual.policy';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { RegistroTrazabilidad } from '../../domain/repositories/historial-interacciones.repository';
import { PrepararEntradaNodoActualService } from './preparar-entrada-nodo-actual.service';

/** Por qué el contenido de un nodo no puede presentarse como el que se vio. */
export enum MotivoContenidoNoVerificable {
  /** El nodo ya no existe. */
  NODO_NO_DISPONIBLE = 'NODO_NO_DISPONIBLE',
  /** El nodo no pertenece al flujo de la sesión. */
  NODO_FUERA_DE_VERSION = 'NODO_FUERA_DE_VERSION',
  /**
   * El flujo de la sesión no es la versión registrada en la sesión, sigue en
   * borrador o no tiene fecha de publicación.
   */
  VERSION_NO_PUBLICADA = 'VERSION_NO_PUBLICADA',
  /** El nodo se modificó después de publicarse su versión. */
  NODO_MODIFICADO_TRAS_PUBLICACION = 'NODO_MODIFICADO_TRAS_PUBLICACION',
  /** El texto procede de un contenido externo (RF-152) sin versionar. */
  CONTENIDO_EXTERNO_NO_VERSIONADO = 'CONTENIDO_EXTERNO_NO_VERSIONADO',
  /** El contenido guardado del nodo no se puede interpretar. */
  CONTENIDO_NO_INTERPRETABLE = 'CONTENIDO_NO_INTERPRETABLE',
}

/** Contenido de un nodo tal como se presentó en la versión de la sesión. */
export type DescripcionNodoHistorico =
  | {
      verificable: true;
      tipoNodo: string;
      /** Textos del nodo unidos por línea en blanco; null si no tiene texto. */
      texto: string | null;
      opciones: { valor: string; etiqueta: string }[] | null;
    }
  | { verificable: false; motivo: MotivoContenidoNoVerificable };

const NO_VERIFICABLE = (
  motivo: MotivoContenidoNoVerificable,
): DescripcionNodoHistorico => ({ verificable: false, motivo });

/**
 * RF-38 (ampliación para M-8): describe qué se presentó en cada nodo de una
 * sesión SIN inventar contenido histórico. El contenido es verificable solo
 * si el nodo pertenece al flujo y versión de la sesión, esa versión está
 * publicada (o archivada) y el nodo no se modificó después de publicarse:
 * la aplicación no permite editar un flujo que dejó de ser borrador y cada
 * versión nueva clona sus nodos. El texto sale solo del JSON del nodo; si
 * depende de un contenido externo (RF-152), que puede cambiar, no se
 * presenta. No firma URL ni consulta recursos multimedia.
 *
 * Reutiliza la política de bloques (`BloquesNodoActual`) y la lectura de la
 * entrada (`PrepararEntradaNodoActualService`) de la presentación de RF-26 y
 * RF-31, sin su parte de recursos firmados.
 */
@Injectable()
export class DescribirContenidoHistoricoService {
  private readonly bloques = new BloquesNodoActual();

  constructor(
    private readonly arboles: ArbolConversacionalRepository,
    private readonly entrada: PrepararEntradaNodoActualService,
  ) {}

  /** Una consulta para todos los nodos y otra para el flujo (sin N+1). */
  async describir(
    sesion: SesionConversacional,
    registros: RegistroTrazabilidad[],
  ): Promise<Map<string, DescripcionNodoHistorico>> {
    const ids = [...new Set(registros.map((registro) => registro.idNodo))];
    if (ids.length === 0) return new Map();

    const [nodos, flujo] = await Promise.all([
      this.arboles.buscarNodosPorIds(ids),
      sesion.idFlujoConversacional === null
        ? Promise.resolve(null)
        : this.arboles.obtenerFlujo(sesion.idFlujoConversacional),
    ]);
    const porId = new Map(nodos.map((nodo) => [nodo.idNodo, nodo]));
    // Fecha de publicación de la versión de la sesión, o null si no es
    // verificable (otra versión, borrador o sin publicar).
    const publicacion =
      flujo !== null &&
      flujo.idFlujo === sesion.idFlujoConversacional &&
      flujo.version === sesion.versionArbolUtilizada &&
      flujo.estado !== EstadoFlujoConversacional.BORRADOR
        ? flujo.fechaPublicacion
        : null;

    return new Map(
      ids.map((id) => {
        const nodo = porId.get(id);
        if (nodo === undefined)
          return [
            id,
            NO_VERIFICABLE(MotivoContenidoNoVerificable.NODO_NO_DISPONIBLE),
          ];
        if (nodo.idFlujo !== sesion.idFlujoConversacional)
          return [
            id,
            NO_VERIFICABLE(MotivoContenidoNoVerificable.NODO_FUERA_DE_VERSION),
          ];
        if (publicacion === null)
          return [
            id,
            NO_VERIFICABLE(MotivoContenidoNoVerificable.VERSION_NO_PUBLICADA),
          ];
        if (nodo.fechaActualizacion.getTime() > publicacion.getTime())
          return [
            id,
            NO_VERIFICABLE(
              MotivoContenidoNoVerificable.NODO_MODIFICADO_TRAS_PUBLICACION,
            ),
          ];
        return [id, this.contenido(nodo)];
      }),
    );
  }

  private contenido(nodo: {
    nombreTipoNodo: string;
    contenido: Record<string, unknown> | null;
    idContenido: string | null;
  }): DescripcionNodoHistorico {
    const contenido = nodo.contenido;
    if (contenido == null || typeof contenido !== 'object')
      return NO_VERIFICABLE(
        MotivoContenidoNoVerificable.CONTENIDO_NO_INTERPRETABLE,
      );
    // Igual que la presentación (RF-26): sin bloques ni multimedia propios,
    // el texto se completa con los recursos del contenido externo.
    const usaContenidoExterno =
      nodo.idContenido !== null &&
      contenido.bloques === undefined &&
      (!Array.isArray(contenido.multimedia) ||
        contenido.multimedia.length === 0);
    if (usaContenidoExterno)
      return NO_VERIFICABLE(
        MotivoContenidoNoVerificable.CONTENIDO_EXTERNO_NO_VERSIONADO,
      );
    try {
      const textos = this.bloques
        .preparar(contenido)
        .flatMap((bloque) =>
          bloque.texto === undefined ? [] : [bloque.texto],
        );
      return {
        verificable: true,
        tipoNodo: nodo.nombreTipoNodo,
        texto: textos.length === 0 ? null : textos.join('\n\n'),
        opciones: this.entrada.preparar(contenido)?.opciones ?? null,
      };
    } catch {
      return NO_VERIFICABLE(
        MotivoContenidoNoVerificable.CONTENIDO_NO_INTERPRETABLE,
      );
    }
  }
}

/**
 * Etiqueta de la respuesta según las opciones del nodo verificado. Solo
 * para opción única y multiselección; si algún valor no tiene etiqueta, no
 * se completa (null). Nunca reemplaza el valor guardado.
 */
export function etiquetaRespuestaHistorica(
  tipoEntrada: string,
  valor: unknown,
  opciones: { valor: string; etiqueta: string }[] | null,
): string | string[] | null {
  if (opciones === null) return null;
  const etiqueta = (v: unknown) =>
    typeof v === 'string'
      ? (opciones.find((opcion) => opcion.valor === v)?.etiqueta ?? null)
      : null;
  const tipo = tipoEntradaConfigurado(tipoEntrada);
  if (tipo === TipoEntradaRespuesta.OPCION_UNICA) return etiqueta(valor);
  if (tipo === TipoEntradaRespuesta.MULTISELECCION && Array.isArray(valor)) {
    const etiquetas = valor.map(etiqueta);
    return etiquetas.every((e): e is string => e !== null) ? etiquetas : null;
  }
  return null;
}
