import { conteo, esObjeto, fechaAgregado } from './vista-agregada';
import type { DatosVistaAgregada } from './vista-agregada';

const FASES = ['INICIO', 'DESARROLLO', 'CIERRE'] as const;
type Fase = (typeof FASES)[number];

export interface DatosNarrativos extends DatosVistaAgregada {
  total_usuarios_cohorte: number | null;
  distribucion_por_fase_narrativa:
    { fase: Fase; total: number | null }[] | null;
  total_usuarios_programa_completado: number | null;
  total_usuarios_con_logros: number | null;
  total_logros_desbloqueados: number | null;
}

function distribucion(
  valor: unknown,
): DatosNarrativos['distribucion_por_fase_narrativa'] {
  if (!Array.isArray(valor)) return null;
  const filas: unknown[] = valor;
  const fases = FASES.flatMap((fase) => {
    const fila = filas.find(
      (entrada): entrada is Record<string, unknown> =>
        esObjeto(entrada) && entrada.fase === fase,
    );
    return fila ? [{ fase, total: conteo(fila.total) }] : [];
  });
  return fases.length > 0 || filas.length === 0 ? fases : null;
}

export function proyectarDatosNarrativos(
  valor: unknown,
): DatosNarrativos | null {
  if (!esObjeto(valor)) return null;
  const fecha = fechaAgregado(valor.fecha_actualizacion);
  if (!fecha) return null;

  return {
    total_usuarios_cohorte: conteo(valor.total_usuarios_cohorte),
    distribucion_por_fase_narrativa: distribucion(
      valor.distribucion_por_fase_narrativa,
    ),
    total_usuarios_programa_completado: conteo(
      valor.total_usuarios_programa_completado,
    ),
    total_usuarios_con_logros: conteo(valor.total_usuarios_con_logros),
    total_logros_desbloqueados: conteo(valor.total_logros_desbloqueados),
    fecha_actualizacion: fecha,
  };
}
