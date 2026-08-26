import { randomUUID } from 'crypto';
import { TipoRecurso } from '../enums/tipo-recurso.enum';

export class RecursoContenido {
  constructor(
    readonly id_recurso: string,
    readonly id_contenido: string,
    readonly tipo_recurso: TipoRecurso,
    readonly orden_bloque: number,
    readonly texto_contenido: string | null,
    readonly clave_almacenamiento: string | null,
    readonly mime_type: string | null,
    readonly tamano_bytes: bigint | null,
    readonly duracion_segundos: number | null,
    readonly texto_alternativo: string | null,
    readonly fecha_creacion: Date,
  ) {}

  static crear(datos: {
    idContenido: string;
    tipoRecurso: TipoRecurso;
    ordenBloque: number;
    textoContenido?: string;
    claveAlmacenamiento?: string;
    mimeType?: string;
    tamanoBytes?: number;
    duracionSegundos?: number;
    textoAlternativo?: string;
  }): RecursoContenido {
    return new RecursoContenido(
      randomUUID(),
      datos.idContenido,
      datos.tipoRecurso,
      datos.ordenBloque,
      this.normalizarOpcional(datos.textoContenido),
      this.normalizarOpcional(datos.claveAlmacenamiento),
      this.normalizarOpcional(datos.mimeType),
      datos.tamanoBytes === undefined ? null : BigInt(datos.tamanoBytes),
      datos.duracionSegundos ?? null,
      this.normalizarOpcional(datos.textoAlternativo),
      new Date(),
    );
  }

  private static normalizarOpcional(valor?: string): string | null {
    return valor?.trim() || null;
  }
}
