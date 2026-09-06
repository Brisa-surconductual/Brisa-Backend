import { RecursoContenido } from '../entities/recurso-contenido.entity';

export abstract class RecursoContenidoRepository {
  abstract crearConModulosDestino(
    recurso: RecursoContenido,
    idModulos: string[],
  ): Promise<RecursoContenido>;

  abstract reordenar(idContenido: string, idRecursos: string[]): Promise<void>;
}
