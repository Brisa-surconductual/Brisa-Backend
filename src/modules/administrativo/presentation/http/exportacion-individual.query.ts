import { detectarCamposRestringidos } from '../../domain/policies/campos-restringidos.policy';

/** Parámetros con los que RF-144 / RF-145 intentan elegir columnas. */
const SELECTORES_COLUMNAS = ['fields', 'columns', 'columnas'];

/**
 * RF-145 FA4 (igual que RF-144): parámetros de la query que intentan ampliar el
 * contenido del CSV (`include_pii=true`, selección de columnas o campos de
 * texto de diario / chat). El CSV no los atiende: sus columnas son fijas. Solo
 * se informan para el log de seguridad y la auditoría.
 */
export function camposExtraExportacion(
  query: Record<string, unknown>,
): string[] {
  const campos = [
    ...([query.include_pii].flat().includes('true') ? ['include_pii'] : []),
    ...SELECTORES_COLUMNAS.filter((parametro) =>
      Object.hasOwn(query, parametro),
    ),
    ...detectarCamposRestringidos(query, new Set()),
  ];
  return [...new Set(campos)];
}
