import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';

export class ModuloDestinoDtoResponse {
  readonly id_modulo: string;
  readonly codigo_modulo: string;
  readonly nombre_modulo: string;

  private constructor(modulo: ModuloSistema) {
    this.id_modulo = modulo.id_modulo;
    this.codigo_modulo = modulo.codigo_modulo;
    this.nombre_modulo = modulo.nombre_modulo;
  }

  static crear(modulo: ModuloSistema): ModuloDestinoDtoResponse {
    return new ModuloDestinoDtoResponse(modulo);
  }
}
