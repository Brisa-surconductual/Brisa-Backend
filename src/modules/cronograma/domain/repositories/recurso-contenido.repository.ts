import { RecursoContenido } from '../entities/recurso-contenido.entity';

export interface RecursoContenidoConModulos {
  recurso: RecursoContenido;
  idModulos: string[];
}

export abstract class RecursoContenidoRepository {
  abstract crearConModulosDestino(
    recurso: RecursoContenido,
    idModulos: string[],
  ): Promise<RecursoContenido>;

  abstract listarPorContenido(
    idContenido: string,
  ): Promise<RecursoContenidoConModulos[]>;

  abstract reordenar(idContenido: string, idRecursos: string[]): Promise<void>;
}
