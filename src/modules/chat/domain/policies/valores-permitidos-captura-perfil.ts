import {
  DimensionPerfilClinico,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';

/** RF-25: dominio clínico exacto que debe exponer la regla de un nodo de captura. */
const DOMINIO_PERFIL_CLINICO: Record<DimensionPerfilClinico, string[]> = {
  [DimensionPerfilClinico.TIPO_DEPENDENCIA]: Object.values(
    TipoDependenciaClinica,
  ),
  [DimensionPerfilClinico.TIPO_CRAVING]: Object.values(TipoCravingClinico),
};

export function valoresPermitidosCoincidenConDominio(
  dimension: DimensionPerfilClinico,
  valoresPermitidos: string[],
): boolean {
  const esperado = DOMINIO_PERFIL_CLINICO[dimension];
  return (
    valoresPermitidos.length === esperado.length &&
    esperado.every((valor) => valoresPermitidos.includes(valor))
  );
}
