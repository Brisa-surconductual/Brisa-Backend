/**
 * RF-142 FA3: parámetros con los que se intenta extraer texto de diario o de
 * chat, o el correo del participante, desde el listado de indicadores.
 */
export const PARAMETROS_RESTRINGIDOS = [
  'incluir_texto',
  'texto_diario',
  'mensajes_chat',
  'correo',
  'email',
  'contenido_diario',
  'contenido_chat',
  'transcripcion_chat',
  'entradas_diario',
] as const;

const PATRON_RESTRINGIDO =
  /texto|diario|chat|mensaje|correo|email|contenido|transcrip/iu;

const nombraCampoRestringido = (valor: unknown): boolean =>
  typeof valor === 'string'
    ? PATRON_RESTRINGIDO.test(valor)
    : Array.isArray(valor) && valor.some(nombraCampoRestringido);

/**
 * Devuelve los parámetros de `entrada` que intentan pedir un campo
 * restringido: los de la lista, los que por su nombre apuntan a texto de
 * diario, chat o correo, y los no permitidos cuyo valor nombra uno de esos
 * campos (p. ej. `campos=texto_diario`). Los parámetros permitidos no se
 * revisan aquí: su valor lo valida el DTO.
 */
export function detectarCamposRestringidos(
  entrada: unknown,
  permitidos: ReadonlySet<string>,
): string[] {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada))
    return [];
  const restringidos = Object.entries(entrada)
    .filter(([clave]) => !permitidos.has(clave))
    .filter(
      ([clave, valor]) =>
        PARAMETROS_RESTRINGIDOS.some((p) => p === clave.toLowerCase()) ||
        PATRON_RESTRINGIDO.test(clave) ||
        nombraCampoRestringido(valor),
    )
    .map(([clave]) => clave);
  return [...new Set(restringidos)];
}
