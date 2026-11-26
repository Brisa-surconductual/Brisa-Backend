/** Forma canónica de un valor JSON: claves de objeto ordenadas. */
function canonico(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor !== null && typeof valor === 'object')
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((clave) => [
          clave,
          canonico((valor as Record<string, unknown>)[clave]),
        ]),
    );
  return valor;
}

/**
 * RF-136 / RF-137: ¿el valor propuesto es el mismo que el vigente? Compara la
 * estructura JSON en profundidad: en los objetos no importa el orden de las
 * claves ni su prototipo (pueden venir de parsers distintos); en las listas sí
 * importa el orden de los elementos; `3` y `'3'` son distintos.
 */
export function sonValoresEquivalentes(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonico(a)) === JSON.stringify(canonico(b));
}

const CLAVE_POR_USUARIO = /usuario|participante|estudiante/iu;

/**
 * RF-137: la configuración es estrictamente global. Detecta, en cualquier
 * nivel del valor, una clave que la asocie a un usuario o participante
 * (`id_usuario`, `codigo_participante`, `usuarios`, ...).
 */
export function contieneCampoPorUsuario(valor: unknown): boolean {
  if (Array.isArray(valor)) return valor.some(contieneCampoPorUsuario);
  if (valor === null || typeof valor !== 'object') return false;
  return Object.entries(valor).some(
    ([clave, interno]) =>
      CLAVE_POR_USUARIO.test(clave) || contieneCampoPorUsuario(interno),
  );
}
