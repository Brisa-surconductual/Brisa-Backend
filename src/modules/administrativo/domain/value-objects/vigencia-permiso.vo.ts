import { VigenciaPermisoInvalidaException } from '../exceptions/permiso-individual.exceptions';

/**
 * Ventana de vigencia de un permiso individual (RF-04). Empieza al otorgarse y
 * termina en `fin`; si `fin` es null, dura hasta que se revoque.
 */
export class VigenciaPermiso {
  private constructor(readonly fin: Date | null) {}

  static crear(fin: Date | null | undefined, ahora: Date): VigenciaPermiso {
    if (fin === null || fin === undefined) return new VigenciaPermiso(null);
    if (Number.isNaN(fin.getTime()) || fin.getTime() <= ahora.getTime())
      throw new VigenciaPermisoInvalidaException();
    return new VigenciaPermiso(fin);
  }
}
