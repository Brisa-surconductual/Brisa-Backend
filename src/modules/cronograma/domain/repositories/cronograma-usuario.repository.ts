import { CronogramaUsuario } from '../entities/cronograma-usuario.entity';

export abstract class CronogramaUsuarioRepository {
  abstract buscarPorUsuario(
    idUsuario: string,
  ): Promise<CronogramaUsuario | null>;

  abstract crear(cronogramaUsuario: CronogramaUsuario): Promise<void>;
}
