import { TipoRecurso } from '../enums/tipo-recurso.enum';
import { DatosRecursoIncoherentesException } from '../exeption/datos-recurso-incoherentes.exception';

export class CoherenciaDatosRecursoVO {
  constructor(
    tipoRecurso: TipoRecurso,
    textoContenido?: string,
    claveAlmacenamiento?: string,
    mimeType?: string,
    tamanoBytes?: number,
  ) {
    const tieneTexto = Boolean(textoContenido?.trim());
    const tieneClave = Boolean(claveAlmacenamiento?.trim());
    const tieneMimeType = Boolean(mimeType?.trim());
    const tieneTamano =
      tamanoBytes !== undefined &&
      Number.isSafeInteger(tamanoBytes) &&
      tamanoBytes > 0;

    if (tipoRecurso === TipoRecurso.TEXTO) {
      if (
        !tieneTexto ||
        tieneClave ||
        tieneMimeType ||
        tamanoBytes !== undefined
      ) {
        throw new DatosRecursoIncoherentesException();
      }
      return;
    }

    if (!tieneClave || !tieneMimeType || !tieneTamano || tieneTexto) {
      throw new DatosRecursoIncoherentesException();
    }
  }
}
