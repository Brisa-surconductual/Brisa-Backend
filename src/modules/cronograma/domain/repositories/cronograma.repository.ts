import { Cronograma } from '../entities/cronograma.entity';

export abstract class CronogramaRepository {
  abstract buscarBaseActiva(): Promise<Cronograma | null>;

  abstract existeBaseConfigurado(): Promise<boolean>;

  abstract buscarPorId(id: string): Promise<Cronograma>;
}
