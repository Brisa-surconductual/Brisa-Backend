import { isISO8601 } from 'class-validator';

const NIVELES = ['INICIAL', 'EN_AVANCE', 'AVANZADO', 'COMPLETADO'] as const;
type NivelProgreso = (typeof NIVELES)[number];

export interface DatosConductuales {
  total_usuarios_activos: number | null;
  distribucion_niveles_progreso:
    { nivel: NivelProgreso; total_usuarios: number | null }[] | null;
  tasa_adherencia_promedio: number | null;
  alertas_inactividad_pendientes: number | null;
  alertas_craving_pendientes: number | null;
  fecha_actualizacion: string;
}

export interface VistaConductual {
  id_cohorte: string;
  estado: 'DISPONIBLE' | 'DESACTUALIZADA' | 'NO_DISPONIBLE';
  estado_agregacion: 'ACTUALIZADO' | 'PENDIENTE' | 'ERROR_ACTUALIZACION';
  ultimo_timestamp_disponible: string | null;
  motivo_sin_datos: 'SIN_CONSOLIDAR' | 'AGREGADO_SUPRIMIDO' | null;
  mensaje: string | null;
  datos: DatosConductuales | null;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function esSnapshotSuprimido(valor: unknown): boolean {
  return esObjeto(valor) && valor.estado === 'SUPRIMIDO';
}

function esNivel(valor: unknown): valor is NivelProgreso {
  return NIVELES.some((nivel) => nivel === valor);
}

function conteo(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0
    ? valor
    : null;
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

  const { fecha_actualizacion: fecha, tasa_adherencia_promedio: tasa } = valor;
  if (
    typeof fecha !== 'string' ||
    !/(?:Z|[+-]\d{2}:\d{2})$/u.test(fecha) ||
    !isISO8601(fecha, { strict: true, strictSeparator: true }) ||
    !Number.isFinite(Date.parse(fecha))
  )
    return null;

  return {
    total_usuarios_activos: conteo(valor.total_usuarios_activos),
    distribucion_niveles_progreso: distribucion(
      valor.distribucion_niveles_progreso,
    ),
    tasa_adherencia_promedio:
      typeof tasa === 'number' && Number.isFinite(tasa) ? tasa : null,
    alertas_inactividad_pendientes: conteo(
      valor.alertas_inactividad_pendientes,
    ),
    alertas_craving_pendientes: conteo(valor.alertas_craving_pendientes),
    fecha_actualizacion: fecha,
  };
}
