import { NIVELES_PROGRESO } from '../../enums/nivel-progreso.enum';
import type { EvolucionTemporal } from '../../results/evolucion-temporal';
import { conteo } from '../../value-objects/conteo-agregado.vo';
import { fechaAgregado } from '../../value-objects/fecha-agregado.vo';
import { esObjeto } from '../../value-objects/objeto-plano.vo';
import { tasaAgregada } from '../../value-objects/tasa-agregada.vo';

interface PuntoConsolidado {
  adherencia: number | null;
  progreso: Record<string, number>;
  craving: number | null;
}

const MENSAJE_UNIDADES_INSUFICIENTES =
  'La cohorte activa aún no cuenta con suficientes unidades temporales transcurridas para mostrar una evolución. La vista estará disponible a partir de la segunda unidad temporal del programa.';

function distribucion(valor: unknown): Record<string, number> | null {
  if (valor === null) return {};
  if (!esObjeto(valor)) return null;

  const resultado: Record<string, number> = {};
  for (const nivel of NIVELES_PROGRESO) {
    const valorNivel = valor[nivel];
    if (valorNivel === undefined || valorNivel === null) continue;
    const total = conteo(valorNivel);
    if (total === null) return null;
    resultado[nivel] = total;
  }
  return resultado;
}

function proyectarPunto(
  fila: Record<string, unknown>,
): PuntoConsolidado | null {
  const adherencia = tasaAgregada(fila.adherencia_promedio);
  const craving = tasaAgregada(fila.craving_promedio);
  const progreso = distribucion(fila.nivel_progreso_distribucion);
  if (
    (adherencia === null && fila.adherencia_promedio !== null) ||
    (craving === null && fila.craving_promedio !== null) ||
    progreso === null
  )
    return null;

  return { adherencia, progreso, craving };
}

/**
 * Construye las series de la cohorte sobre el catálogo de unidades temporales,
 * rellenando con vacíos las unidades sin datos (RF-141). Devuelve `null` si el
 * agregado externo no cumple el contrato.
 */
export function construirEvolucionTemporal(
  idCohorte: string,
  catalogo: readonly string[],
  datos: unknown,
): EvolucionTemporal | null {
  if (!esObjeto(datos) || !Array.isArray(datos.indicadores)) return null;
  const fecha = fechaAgregado(datos.fecha_actualizacion);
  if (!fecha) return null;

  const ultima = datos.id_ultima_unidad_transcurrida;
  const indiceUltima =
    typeof ultima === 'string' ? catalogo.indexOf(ultima) : -1;
  if (ultima !== null && indiceUltima < 0) return null;

  const unidades = catalogo.slice(0, indiceUltima + 1);
  const permitidas = new Set(unidades);
  const puntos = new Map<string, PuntoConsolidado>();
  const filas: unknown[] = datos.indicadores;
  for (const fila of filas) {
    if (!esObjeto(fila) || typeof fila.id_unidad_temporal !== 'string')
      return null;
    const id = fila.id_unidad_temporal;
    if (!permitidas.has(id) || puntos.has(id)) return null;
    const punto = proyectarPunto(fila);
    if (punto === null) return null;
    puntos.set(id, punto);
  }

  const respuesta: EvolucionTemporal = {
    id_cohorte: idCohorte,
    serie_unidades_temporales: unidades,
    serie_adherencia_promedio: [],
    serie_nivel_progreso_distribucion: [],
    serie_craving_promedio: [],
    unidades_con_datos_insuficientes: [],
    fecha_actualizacion: fecha,
  };
  for (const id of unidades) {
    const { adherencia, progreso, craving } = puntos.get(id) ?? {
      adherencia: null,
      progreso: {},
      craving: null,
    };
    respuesta.serie_adherencia_promedio.push(adherencia);
    respuesta.serie_nivel_progreso_distribucion.push(progreso);
    respuesta.serie_craving_promedio.push(craving);
    if (
      adherencia === null &&
      craving === null &&
      Object.keys(progreso).length === 0
    ) {
      respuesta.unidades_con_datos_insuficientes.push(id);
    }
  }
  if (unidades.length < 2) respuesta.mensaje = MENSAJE_UNIDADES_INSUFICIENTES;
  return respuesta;
}
