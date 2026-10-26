export interface ConteoElegibilidadModalidad {
  readonly totalUsuariosActivos: number;
  readonly conPerfilCompleto: number;
  readonly modalidadGrupal: boolean;
}

export interface ResultadoEvaluacionElegibilidad {
  readonly totalUsuariosActivos: number;
  readonly conPerfilCompleto: number;
  readonly sinPerfilCompleto: number;
  readonly elegible: boolean;
}

export class EvaluadorElegibilidadModalidad {
  evaluar(
    datos: ConteoElegibilidadModalidad,
  ): ResultadoEvaluacionElegibilidad {
    const { totalUsuariosActivos, conPerfilCompleto, modalidadGrupal } =
      datos;

    if (
      !Number.isSafeInteger(totalUsuariosActivos) ||
      !Number.isSafeInteger(conPerfilCompleto) ||
      totalUsuariosActivos < 0 ||
      conPerfilCompleto < 0 ||
      conPerfilCompleto > totalUsuariosActivos
    ) {
      throw new RangeError('Los conteos de perfiles activos son invalidos.');
    }

    const sinPerfilCompleto = totalUsuariosActivos - conPerfilCompleto;

    return {
      totalUsuariosActivos,
      conPerfilCompleto,
      sinPerfilCompleto,
      elegible:
        modalidadGrupal &&
        totalUsuariosActivos > 0 &&
        sinPerfilCompleto === 0,
    };
  }
}
