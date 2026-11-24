import {
  conteo,
  esObjeto,
  fechaAgregado,
  tasaAgregada,
} from './vista-agregada';
import type { DatosVistaAgregada } from './vista-agregada';

const NIVELES = ['INICIAL', 'EN_AVANCE', 'AVANZADO', 'COMPLETADO'] as const;
type NivelProgreso = (typeof NIVELES)[number];

export interface DatosConductuales extends DatosVistaAgregada {
  total_usuarios_activos: number | null;
  distribucion_niveles_progreso:
    { nivel: NivelProgreso; total_usuarios: number | null }[] | null;
  tasa_adherencia_promedio: number | null;
  alertas_inactividad_pendientes: number | null;
  alertas_craving_pendientes: number | null;
}

function esNivel(valor: unknown): valor is NivelProgreso {
  return NIVELES.some((nivel) => nivel === valor);
}

function distribucion(
  valor: unknown,
): DatosConductuales['distribucion_niveles_progreso'] {
  if (!Array.isArray(valor)) return null;

  const niveles: NonNullable<
    DatosConductuales['distribucion_niveles_progreso']
  > = [];
  for (const fila of valor as unknown[]) {
    if (!esObjeto(fila) || !esNivel(fila.nivel)) continue;
    niveles.push({
      nivel: fila.nivel,
      total_usuarios: conteo(fila.total_usuarios),
    });
  }
  return niveles.length > 0 || valor.length === 0 ? niveles : null;
}

export function proyectarDatosConductuales(
  valor: unknown,
): DatosConductuales | null {
  if (!esObjeto(valor)) return null;

  const fecha = fechaAgregado(valor.fecha_actualizacion);
  if (!fecha) return null;

  return {
    total_usuarios_activos: conteo(valor.total_usuarios_activos),
    distribucion_niveles_progreso: distribucion(
      valor.distribucion_niveles_progreso,
    ),
    tasa_adherencia_promedio: tasaAgregada(valor.tasa_adherencia_promedio),
    alertas_inactividad_pendientes: conteo(
      valor.alertas_inactividad_pendientes,
    ),
    alertas_craving_pendientes: conteo(valor.alertas_craving_pendientes),
    fecha_actualizacion: fecha,
  };
}
