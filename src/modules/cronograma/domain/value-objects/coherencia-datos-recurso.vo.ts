import { TipoRecurso } from '../enums/tipo-recurso.enum';
import { DatosRecursoIncoherentesException } from '../exeption/datos-recurso-incoherentes.exception';

export class CoherenciaDatosRecursoVO {
  constructor(
    tipoRecurso: TipoRecurso,
    textoContenido?: string,
    claveAlmacenamiento?: string,
  ) {
    const tieneTexto = Boolean(textoContenido?.trim());
    const tieneClave = Boolean(claveAlmacenamiento?.trim());

    if (tipoRecurso === TipoRecurso.TEXTO) {
      if (!tieneTexto || tieneClave) {
        throw new DatosRecursoIncoherentesException();
      }
      return;
    }

    if (!tieneClave || tieneTexto) {
      throw new DatosRecursoIncoherentesException();
    }
  }
}
