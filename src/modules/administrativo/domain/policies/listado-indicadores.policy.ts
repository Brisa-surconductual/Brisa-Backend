import { NIVELES_PROGRESO } from '../enums/nivel-progreso.enum';
import type {
  FiltrosListadoIndicadores,
  IndicadoresParticipanteListado,
  OrdenListadoIndicadores,
  PaginaListado,
} from '../results/listado-indicadores';

type Fila = IndicadoresParticipanteListado;

/** RF-142: aplica los filtros combinados (todos deben cumplirse). */
export function filtrarIndicadores(
  filas: readonly Fila[],
  filtros: FiltrosListadoIndicadores,
): Fila[] {
  const { nivel_progreso, adherencia_min, adherencia_max, con_alertas } =
    filtros;
  return filas.filter((fila) => {
    if (nivel_progreso !== undefined && fila.nivel_progreso !== nivel_progreso)
      return false;
    if (adherencia_min !== undefined || adherencia_max !== undefined) {
      // Sin dato de adherencia no se puede afirmar que esté en el rango.
      if (fila.tasa_adherencia === null) return false;
      if (adherencia_min !== undefined && fila.tasa_adherencia < adherencia_min)
        return false;
      if (adherencia_max !== undefined && fila.tasa_adherencia > adherencia_max)
        return false;
    }
    if (con_alertas !== undefined && fila.alertas_activas > 0 !== con_alertas)
      return false;
    return true;
  });
}

/** Valor comparable del campo; null = sin dato. */
function valorOrden(
  fila: Fila,
  campo: OrdenListadoIndicadores['campo'],
): string | number | null {
  switch (campo) {
    case 'nivel_progreso':
      // Orden del nivel (INICIAL < ... < COMPLETADO), no alfabético.
      return fila.nivel_progreso === null
        ? null
        : NIVELES_PROGRESO.indexOf(fila.nivel_progreso);
    case 'tasa_adherencia':
      return fila.tasa_adherencia;
    case 'alertas_activas':
      return fila.alertas_activas;
    case 'alertas_atendidas':
      return fila.alertas_atendidas;
    case 'codigo_participante':
      return fila.codigo_participante;
  }
}

/**
 * RF-142: ordena por el campo pedido. Los participantes sin dato van siempre
 * al final, en cualquier dirección; el desempate es por código (ascendente)
 * para que el orden sea estable entre páginas.
 */
export function ordenarIndicadores(
  filas: readonly Fila[],
  { campo, direccion }: OrdenListadoIndicadores,
): Fila[] {
  const signo = direccion === 'DESC' ? -1 : 1;
  return [...filas].sort((a, b) => {
    const va = valorOrden(a, campo);
    const vb = valorOrden(b, campo);
    if (va !== vb) {
      if (va === null) return 1;
      if (vb === null) return -1;
      return (va < vb ? -1 : 1) * signo;
    }
    return a.codigo_participante < b.codigo_participante
      ? -1
      : a.codigo_participante > b.codigo_participante
        ? 1
        : 0;
  });
}

/** Página de resultados; `total` es el número de filas antes de paginar. */
export function paginar<T>(
  filas: readonly T[],
  { offset, limit }: PaginaListado,
): { items: T[]; total: number } {
  return { items: filas.slice(offset, offset + limit), total: filas.length };
}
