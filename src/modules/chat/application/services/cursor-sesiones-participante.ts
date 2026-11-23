import { CursorSesionesParticipante } from '../../domain/repositories/sesion-conversacional.repository';

/** Marca de orden con la precisión de la BD (microsegundos, UTC). */
const MARCA_ORDEN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * RF-38 (M-8): cursor opaco del listado de sesiones de un participante. Lleva
 * solo la posición (marca de orden e `id_sesion` de la última sesión
 * entregada), nunca datos del participante. El cliente no debe interpretarlo.
 */
export function codificarCursorSesiones(
  cursor: CursorSesionesParticipante,
): string {
  return Buffer.from(
    JSON.stringify({ f: cursor.fechaUltimaInteraccion, s: cursor.idSesion }),
    'utf8',
  ).toString('base64url');
}

/** Cursor válido, o null si no es uno generado por este servicio. */
export function decodificarCursorSesiones(
  texto: string,
): CursorSesionesParticipante | null {
  try {
    const valor: unknown = JSON.parse(
      Buffer.from(texto, 'base64url').toString('utf8'),
    );
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor))
      return null;
    const { f, s } = valor as { f?: unknown; s?: unknown };
    if (
      typeof f !== 'string' ||
      typeof s !== 'string' ||
      !MARCA_ORDEN.test(f) ||
      !Number.isFinite(Date.parse(f)) ||
      !UUID.test(s)
    )
      return null;
    return { fechaUltimaInteraccion: f, idSesion: s };
  } catch {
    return null;
  }
}
