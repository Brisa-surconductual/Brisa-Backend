import { FASES_NARRATIVAS } from '../../enums/fase-narrativa.enum';
import type { FaseNarrativa } from '../../enums/fase-narrativa.enum';
import type { DatosVistaAgregada } from '../../results/vista-agregada';
import { conteo } from '../../value-objects/conteo-agregado.vo';
import { fechaAgregado } from '../../value-objects/fecha-agregado.vo';
import { esObjeto } from '../../value-objects/objeto-plano.vo';

/** Progresión narrativa agregada de una cohorte (RF-133). */
export interface DatosNarrativos extends DatosVistaAgregada {
  total_usuarios_cohorte: number | null;
  distribucion_por_fase_narrativa:
    { fase: FaseNarrativa; total: number | null }[] | null;
  total_usuarios_programa_completado: number | null;
  total_usuarios_con_logros: number | null;
  total_logros_desbloqueados: number | null;
}

function distribucion(
  valor: unknown,
): DatosNarrativos['distribucion_por_fase_narrativa'] {
  if (!Array.isArray(valor)) return null;
  const filas: unknown[] = valor;
  const fases = FASES_NARRATIVAS.flatMap((fase) => {
    const fila = filas.find(
      (entrada): entrada is Record<string, unknown> =>
        esObjeto(entrada) && entrada.fase === fase,
    );
    return fila ? [{ fase, total: conteo(fila.total) }] : [];
  });
  return fases.length > 0 || filas.length === 0 ? fases : null;
}

/** Proyecta el snapshot externo a la lista blanca de indicadores narrativos. */
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
