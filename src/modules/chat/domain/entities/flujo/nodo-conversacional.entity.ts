import { randomUUID } from 'crypto';
import { TipoNodoConversacional } from '../catalogos/tipo-nodo.entity';

export class NodoConversacional {
  constructor(
    readonly idNodo: string,
    readonly idFlujo: string,
    readonly idTipoNodo: string,
    readonly nombreTipoNodo: string,
    readonly contenido: Record<string, unknown>,
    readonly esNodoInicial: boolean,
    readonly orden: number | null,
    readonly idContenidoCronograma: string | null,
    readonly creadoPor: string,
    readonly fechaCreacion: Date,
    readonly fechaActualizacion: Date,
  ) {}

  static crear(
    idFlujo: string,
    tipo: TipoNodoConversacional,
    contenido: Record<string, unknown>,
    esNodoInicial: boolean,
    orden: number | null,
    idContenidoCronograma: string | null,
    creadoPor: string,
  ): NodoConversacional {
    const ahora = new Date();
    return new NodoConversacional(
      randomUUID(),
      idFlujo,
      tipo.idTipoNodo,
      tipo.nombre,
      contenido,
      esNodoInicial,
      orden,
      idContenidoCronograma,
      creadoPor,
      ahora,
      ahora,
    );
  }

  /** Aplica los cambios indicados; `undefined` conserva el valor actual. */
  actualizar(
    cambios: Partial<
      Pick<
        NodoConversacional,
        'contenido' | 'esNodoInicial' | 'orden' | 'idContenidoCronograma'
      >
    >,
    tipo?: TipoNodoConversacional,
  ): NodoConversacional {
    return new NodoConversacional(
      this.idNodo,
      this.idFlujo,
      tipo?.idTipoNodo ?? this.idTipoNodo,
      tipo?.nombre ?? this.nombreTipoNodo,
      cambios.contenido ?? this.contenido,
      cambios.esNodoInicial ?? this.esNodoInicial,
      cambios.orden === undefined ? this.orden : cambios.orden,
      cambios.idContenidoCronograma === undefined
        ? this.idContenidoCronograma
        : cambios.idContenidoCronograma,
      this.creadoPor,
      this.fechaCreacion,
      new Date(),
    );
  }

  copiarEn(idFlujo: string, creadoPor: string): NodoConversacional {
    const ahora = new Date();
    return new NodoConversacional(
      randomUUID(),
      idFlujo,
      this.idTipoNodo,
      this.nombreTipoNodo,
      this.contenido,
      this.esNodoInicial,
      this.orden,
      this.idContenidoCronograma,
      creadoPor,
      ahora,
      ahora,
    );
  }
}
