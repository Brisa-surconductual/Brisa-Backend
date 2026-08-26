import { Contenido } from '../entities/contenido.entity';

export abstract class ContenidoRepository {
  abstract crear(contenido: Contenido): Promise<Contenido>;
  abstract buscarPorId(idContenido: string): Promise<Contenido | null>;
  abstract actualizar(contenido: Contenido): Promise<Contenido>;
  abstract eliminar(idContenido: string): Promise<void>;
}
