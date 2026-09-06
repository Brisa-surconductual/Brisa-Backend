import { TipoRecurso } from '../enums/tipo-recurso.enum';
import { MimeTypeRecursoIncompatibleException } from '../exeption/mime-type-recurso-incompatible.exception';
import { TipoRecursoNoMultimediaException } from '../exeption/tipo-recurso-no-multimedia.exception';

export class CoherenciaMimeTypeRecursoVO {
  readonly valor: string;

  constructor(tipoRecurso: TipoRecurso, mimeType: string) {
    if (tipoRecurso === TipoRecurso.TEXTO) {
      throw new TipoRecursoNoMultimediaException();
    }

    const mimeNormalizado = mimeType.trim().toLowerCase().split(';')[0];
    const esCompatible = this.esCompatible(tipoRecurso, mimeNormalizado);

    if (!mimeNormalizado || !esCompatible) {
      throw new MimeTypeRecursoIncompatibleException();
    }

    this.valor = mimeNormalizado;
  }

  private esCompatible(tipo: TipoRecurso, mimeType: string): boolean {
    switch (tipo) {
      case TipoRecurso.IMAGEN:
        return mimeType.startsWith('image/');
      case TipoRecurso.VIDEO:
        return mimeType.startsWith('video/');
      case TipoRecurso.AUDIO:
        return mimeType.startsWith('audio/');
      case TipoRecurso.DOCUMENTO:
        return (
          mimeType.startsWith('application/') || mimeType.startsWith('text/')
        );
      default:
        return false;
    }
  }
}
