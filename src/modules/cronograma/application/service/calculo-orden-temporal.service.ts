type Ordenable = {
  orden_unidad?: number;
  orden_contenido?: number;
  ordenContenido?: number;
};

export class CalculoOrdenTemporalService {
  public calcularSiguienteOrden<T extends Ordenable>(
    elementosExistentes: T[],
  ): number {
    if (elementosExistentes.length === 0) {
      return 1;
    }

    const ordenMaximo = Math.max(
      0,
      ...elementosExistentes.map((elemento) =>
        elemento.orden_unidad ??
        elemento.orden_contenido ??
        elemento.ordenContenido ??
        0,
      ),
    );

    return ordenMaximo + 1;
  }
}