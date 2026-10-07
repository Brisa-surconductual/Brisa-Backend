import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';

export interface SolicitudUrlSubidaRecurso {
  idContenido: string;
  tipoRecurso: TipoRecurso;
  mimeType: string;
  tamanoBytes: number;
}

export interface UrlSubidaRecurso {
  claveAlmacenamiento: string;
  url: string;
  metodo: 'PUT';
  encabezados: Record<string, string>;
  expiraEnSegundos: number;
}

export interface SolicitudObjetoAlmacenado {
  idContenido: string;
  claveAlmacenamiento: string;
}

export interface MetadatosObjetoAlmacenado {
  mimeType: string | null;
  tamanoBytes: number | null;
}

export abstract class AlmacenamientoRecursosPort {
  abstract crearUrlSubida(
    solicitud: SolicitudUrlSubidaRecurso,
  ): Promise<UrlSubidaRecurso>;

  abstract obtenerMetadatos(
    solicitud: SolicitudObjetoAlmacenado,
  ): Promise<MetadatosObjetoAlmacenado | null>;
}
