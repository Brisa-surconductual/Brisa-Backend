import { UrlSubidaRecurso } from '../ports/almacenamiento-recursos.port';

export class UrlSubidaRecursoDtoResponse {
  readonly clave_almacenamiento: string;
  readonly url_subida: string;
  readonly metodo: 'PUT';
  readonly encabezados: Record<string, string>;
  readonly expira_en_segundos: number;

  private constructor(resultado: UrlSubidaRecurso) {
    this.clave_almacenamiento = resultado.claveAlmacenamiento;
    this.url_subida = resultado.url;
    this.metodo = resultado.metodo;
    this.encabezados = resultado.encabezados;
    this.expira_en_segundos = resultado.expiraEnSegundos;
  }

  static crear(resultado: UrlSubidaRecurso): UrlSubidaRecursoDtoResponse {
    return new UrlSubidaRecursoDtoResponse(resultado);
  }
}
