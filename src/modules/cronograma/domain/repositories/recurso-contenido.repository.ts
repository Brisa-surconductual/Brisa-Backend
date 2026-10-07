import { RecursoContenido } from '../entities/recurso-contenido.entity';

export interface RecursoContenidoDetalle {
  recurso: RecursoContenido;
  idModulos: string[];
}

export interface CambiosRecursoContenido {
  textoContenido?: string;
  textoAlternativo?: string | null;
  duracionSegundos?: number | null;
  idModulos?: string[];
  archivo?: {
    claveAlmacenamiento: string;
    mimeType: string;
    tamanoBytes: number;
  };
}

export abstract class RecursoContenidoRepository {
  abstract crearConModulosDestino(
    recurso: RecursoContenido,
    idModulos: string[],
  ): Promise<RecursoContenido>;

  abstract reordenar(idContenido: string, idRecursos: string[]): Promise<void>;

  abstract listarPorContenido(
    idContenido: string,
  ): Promise<RecursoContenidoDetalle[]>;
  abstract buscarDetalle(
    idRecurso: string,
  ): Promise<RecursoContenidoDetalle | null>;
  abstract asegurarContenidoEditable(idContenido: string): Promise<void>;
  abstract actualizar(
    idRecurso: string,
    cambios: CambiosRecursoContenido,
  ): Promise<RecursoContenidoDetalle>;
  abstract eliminar(idRecurso: string): Promise<void>;
}
