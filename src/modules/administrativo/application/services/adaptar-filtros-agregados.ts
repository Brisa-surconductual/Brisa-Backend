import {
  CAMPOS_FILTRO_AGREGADO,
  type CampoFiltroAgregado,
  type FiltrosAgregados,
} from '../../domain/results/filtros-agregados';

export function separarFiltrosAgregados(
  solicitados: FiltrosAgregados,
  soportados: readonly CampoFiltroAgregado[] = [],
) {
  const presentes = CAMPOS_FILTRO_AGREGADO.filter(
    (campo) => solicitados[campo] !== undefined,
  );
  return {
    filtros_aplicados: Object.fromEntries(
      presentes
        .filter((campo) => soportados.includes(campo))
        .map((campo) => [campo, solicitados[campo]]),
    ) as FiltrosAgregados,
    filtros_omitidos: presentes.filter((campo) => !soportados.includes(campo)),
  };
}
