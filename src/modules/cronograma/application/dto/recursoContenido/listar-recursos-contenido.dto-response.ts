import { RecursoContenido } from '../../../domain/entities/recurso-contenido.entity';
import { TipoRecurso } from '../../../domain/enums/tipo-recurso.enum';

export class ListarRecursosContenidoDtoResponse {
  idRecurso!: string;
  tipoRecurso!: TipoRecurso;
  ordenBloque!: number;
  textoContenido!: string | null;
  claveAlmacenamiento!: string | null;
  mimeType!: string | null;
  tamanoBytes!: number | null;
  duracionSegundos!: number | null;
  textoAlternativo!: string | null;
  idModulos!: string[];

  static crear(
    recurso: RecursoContenido,
    idModulos: string[],
  ): ListarRecursosContenidoDtoResponse {
    const dto = new ListarRecursosContenidoDtoResponse();

    dto.idRecurso = recurso.id_recurso;
    dto.tipoRecurso = recurso.tipo_recurso;
    dto.ordenBloque = recurso.orden_bloque;
    dto.textoContenido = recurso.texto_contenido;
    dto.claveAlmacenamiento = recurso.clave_almacenamiento;
    dto.mimeType = recurso.mime_type;
    dto.tamanoBytes =
      recurso.tamano_bytes === null ? null : Number(recurso.tamano_bytes);
    dto.duracionSegundos = recurso.duracion_segundos;
    dto.textoAlternativo = recurso.texto_alternativo;
    dto.idModulos = idModulos;

    return dto;
  }
}
