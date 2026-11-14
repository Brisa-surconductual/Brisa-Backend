import { Injectable } from '@nestjs/common';
import {
  BloqueNodoActual,
  BloquesNodoActual,
} from '../../domain/policies/bloques-nodo-actual.policy';
import { BloqueNodoDtoResponse } from '../dto/presentacion-nodo-actual.dto-response';
import {
  FirmarRecursoNodoPort,
  RecursoNodoActual,
} from '../ports/presentacion-nodo-actual.port';

@Injectable()
export class PresentarBloquesNodoActualService {
  private readonly bloques = new BloquesNodoActual();
  constructor(private readonly firmar: FirmarRecursoNodoPort) {}

  async preparar(
    contenido: Record<string, unknown>,
    recursos: RecursoNodoActual[],
  ): Promise<BloqueNodoDtoResponse[]> {
    const bloques = this.bloques.preparar(contenido);
    if (
      contenido.bloques === undefined &&
      (!Array.isArray(contenido.multimedia) ||
        contenido.multimedia.length === 0)
    ) {
      for (const recurso of recursos) {
        if (recurso.tipo === 'TEXTO' && !recurso.texto?.trim()) continue;
        bloques.push({
          orden: bloques.length + 1,
          tipo: recurso.tipo,
          ...(recurso.tipo === 'TEXTO'
            ? { texto: recurso.texto ?? '' }
            : { idRecurso: recurso.idRecurso }),
        });
      }
    }
    if (bloques.length === 0) throw new Error('Contenido no disponible.');
    return Promise.all(bloques.map((b) => this.presentar(b, recursos)));
  }

  private async presentar(
    b: BloqueNodoActual,
    recursos: RecursoNodoActual[],
  ): Promise<BloqueNodoDtoResponse> {
    if (b.texto !== undefined)
      return { orden: b.orden, tipo: b.tipo, texto: b.texto };
    const enlace =
      b.url && !b.idRecurso && !b.claveAlmacenamiento
        ? new URL(b.url)
        : undefined;
    const firmaAnterior = enlace?.searchParams.has('X-Amz-Signature') === true;
    if (b.idRecurso || b.claveAlmacenamiento || firmaAnterior) {
      const rutaAnterior =
        enlace && firmaAnterior ? decodeURIComponent(enlace.pathname) : null;
      const recurso = recursos.find((r) => {
        if (b.idRecurso) return r.idRecurso === b.idRecurso;
        if (b.claveAlmacenamiento)
          return r.claveAlmacenamiento === b.claveAlmacenamiento;
        return (
          rutaAnterior !== null &&
          r.claveAlmacenamiento !== null &&
          rutaAnterior.endsWith('/' + r.claveAlmacenamiento)
        );
      });
      if (
        !recurso?.claveAlmacenamiento ||
        recurso.tipo !== (b.tipo === 'GIF' ? 'IMAGEN' : b.tipo)
      )
        throw new Error('Recurso no disponible para este nodo.');
      const acceso = await this.firmar.lectura(recurso.claveAlmacenamiento);
      return {
        orden: b.orden,
        tipo: b.tipo,
        ...acceso,
        mimeType: recurso.mimeType,
        textoAlternativo: recurso.textoAlternativo,
        duracionSegundos: recurso.duracionSegundos,
      };
    }
    // Referencias HTTPS públicas previamente asociadas por el editor; no se
    // descargan ni se renuevan enlaces externos desde el servidor.
    if (
      !enlace ||
      enlace.protocol !== 'https:' ||
      enlace.username ||
      enlace.password
    )
      throw new Error('URL no disponible.');
    if (
      b.expiraEn !== null &&
      b.expiraEn !== undefined &&
      (!Number.isFinite(Date.parse(b.expiraEn)) ||
        Date.parse(b.expiraEn) <= Date.now())
    )
      throw new Error('URL vencida sin referencia renovable.');
    return {
      orden: b.orden,
      tipo: b.tipo,
      url: b.url,
      expiraEn: b.expiraEn ?? null,
      mimeType: b.mimeType ?? null,
      textoAlternativo: b.textoAlternativo ?? null,
      duracionSegundos: b.duracionSegundos ?? null,
    };
  }
}
