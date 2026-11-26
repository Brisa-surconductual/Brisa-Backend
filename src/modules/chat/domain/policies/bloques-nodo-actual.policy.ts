export interface BloqueNodoActual {
  orden: number;
  tipo: string;
  texto?: string;
  idRecurso?: string;
  claveAlmacenamiento?: string;
  url?: string;
  expiraEn?: string | null;
  mimeType?: string | null;
  textoAlternativo?: string | null;
  duracionSegundos?: number | null;
}

const objeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const texto = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined;

/** Solo adapta representación; no interpreta respuestas ni condiciones de navegación. */
export class BloquesNodoActual {
  preparar(contenido: Record<string, unknown>): BloqueNodoActual[] {
    let bloques: unknown[];
    if (contenido.bloques !== undefined) {
      if (!Array.isArray(contenido.bloques))
        throw new Error('Bloques no disponibles.');
      bloques = contenido.bloques;
    } else {
      bloques = [];
      if (typeof contenido.texto === 'string')
        bloques.push({ tipo: 'TEXTO', texto: contenido.texto });
      if (typeof contenido.instrucciones === 'string')
        bloques.push({ tipo: 'INSTRUCCION', texto: contenido.instrucciones });
      if (Array.isArray(contenido.multimedia))
        bloques.push(...(contenido.multimedia as unknown[]));
    }
    return bloques
      .map((valor, indice) => this.bloque(valor, indice + 1))
      .filter((b) => b.texto === undefined || b.texto.trim().length > 0)
      .sort((a, b) => a.orden - b.orden);
  }

  private bloque(valor: unknown, posicion: number): BloqueNodoActual {
    if (!objeto(valor)) throw new Error('Bloque no disponible.');
    const tipo =
      texto(valor.tipo) ??
      texto(valor.tipo_recurso) ??
      this.tipoPorMime(valor.mimeType ?? valor.mime_type) ??
      this.tipoPorUrl(valor.url);
    if (
      !tipo ||
      ![
        'TEXTO',
        'INSTRUCCION',
        'IMAGEN',
        'VIDEO',
        'AUDIO',
        'DOCUMENTO',
        'GIF',
      ].includes(tipo)
    )
      throw new Error('Tipo de bloque no disponible.');
    const orden = valor.orden ?? posicion;
    if (typeof orden !== 'number' || !Number.isInteger(orden) || orden < 0)
      throw new Error('Orden no disponible.');
    if (tipo === 'TEXTO' || tipo === 'INSTRUCCION') {
      const contenido = texto(valor.texto) ?? texto(valor.texto_contenido);
      if (contenido === undefined) throw new Error('Texto no disponible.');
      return { orden, tipo, texto: contenido };
    }
    return {
      orden,
      tipo,
      idRecurso: texto(valor.idRecurso) ?? texto(valor.id_recurso),
      claveAlmacenamiento:
        texto(valor.claveAlmacenamiento) ?? texto(valor.clave_almacenamiento),
      url: texto(valor.url),
      expiraEn: texto(valor.expiraEn) ?? null,
      mimeType: texto(valor.mimeType) ?? texto(valor.mime_type) ?? null,
      textoAlternativo:
        texto(valor.textoAlternativo) ?? texto(valor.texto_alternativo) ?? null,
      duracionSegundos:
        typeof (valor.duracionSegundos ?? valor.duracion_segundos) === 'number'
          ? Number(valor.duracionSegundos ?? valor.duracion_segundos)
          : null,
    };
  }

  private tipoPorMime(mime: unknown): string | undefined {
    if (typeof mime !== 'string') return undefined;
    if (mime === 'image/gif') return 'GIF';
    if (mime.startsWith('image/')) return 'IMAGEN';
    if (mime.startsWith('video/')) return 'VIDEO';
    if (mime.startsWith('audio/')) return 'AUDIO';
    return undefined;
  }

  private tipoPorUrl(url: unknown): string | undefined {
    if (typeof url !== 'string') return undefined;
    const extension = new URL(url).pathname.split('.').pop()?.toLowerCase();
    if (extension === 'gif') return 'GIF';
    if (extension && ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(extension))
      return 'IMAGEN';
    if (extension && ['mp4', 'webm'].includes(extension)) return 'VIDEO';
    if (extension && ['mp3', 'ogg', 'wav'].includes(extension)) return 'AUDIO';
    return undefined;
  }
}
