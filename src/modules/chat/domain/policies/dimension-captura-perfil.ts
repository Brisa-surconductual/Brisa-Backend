import { DimensionPerfilClinico } from '../enums/perfil-clinico.enum';
import { configuracionRespuestaInvalida as configuracion } from '../exceptions/respuesta.exceptions';

/**
 * Lee la marca `capturaPerfil` (o su alias legado `captura_perfil`) del
 * contenido de un nodo. Solo el árbol designa qué nodo captura cada
 * dimensión del perfil clínico (RF-27B); el valor no lo envía el cliente.
 */
export function extraerDimensionCapturaPerfil(
  contenido: Record<string, unknown>,
): DimensionPerfilClinico | null {
  const { capturaPerfil, captura_perfil: anterior } = contenido;
  if (capturaPerfil == null && anterior == null) return null;

  const dimension =
    typeof capturaPerfil === 'object' && !Array.isArray(capturaPerfil)
      ? (capturaPerfil as { dimension?: unknown } | null)?.dimension
      : capturaPerfil;

  const legado =
    anterior === 'tipo_dependencia'
      ? DimensionPerfilClinico.TIPO_DEPENDENCIA
      : anterior === 'tipo_craving'
        ? DimensionPerfilClinico.TIPO_CRAVING
        : null;

  if (
    (anterior != null && legado === null) ||
    (capturaPerfil != null &&
      dimension !== DimensionPerfilClinico.TIPO_DEPENDENCIA &&
      dimension !== DimensionPerfilClinico.TIPO_CRAVING) ||
    (capturaPerfil != null && legado !== null && dimension !== legado)
  ) {
    return configuracion('Dimensión clínica no configurada o contradictoria.');
  }

  return (dimension ?? legado) as DimensionPerfilClinico;
}
