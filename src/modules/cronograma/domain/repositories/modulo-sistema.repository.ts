import { ModuloSistema } from '../entities/modulo-sistema.entity';

export abstract class ModuloSistemaRepository {
  abstract listarActivos(): Promise<ModuloSistema[]>;
  abstract buscarActivoPorCodigo(
    codigoModulo: string,
  ): Promise<ModuloSistema | null>;
}
