import { isUUID } from 'class-validator';
import { ConsultaFiltradaException } from '../../application/exceptions/consulta-filtrada.exception';
import { TipoVistaAgregada } from '../../domain/enums/tipo-vista-agregada.enum';
import {
  INDICADORES_COMPARACION,
  type ConsultaComparacionCohortes,
  type IndicadorComparacion,
} from '../../domain/results/comparacion-cohortes';
import type {
  FiltrosAgregados,
  ObjetivoVistaAgregada,
} from '../../domain/results/filtros-agregados';

const PARAMETROS_COMPARACION = new Set([
  'ids',
  'indicadores',
  'fecha_inicio',
  'fecha_fin',
]);
const MAX_COHORTES = 5;

function leerFecha(valor: unknown): string | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(valor)) {
    const fecha = new Date(valor + 'T00:00:00Z');
    if (
      Number.isFinite(fecha.getTime()) &&
      fecha.toISOString().slice(0, 10) === valor
    )
      return valor;
  }
  throw new ConsultaFiltradaException('RANGO_FECHAS_INVALIDO');
}

function leerRango(consulta: Record<string, unknown>) {
  const inicio = leerFecha(consulta.fecha_inicio);
  const fin = leerFecha(consulta.fecha_fin);
  if (inicio !== undefined && fin !== undefined && inicio > fin)
    throw new ConsultaFiltradaException('RANGO_FECHAS_INVALIDO');
  return {
    ...(inicio !== undefined && { fecha_inicio: inicio }),
    ...(fin !== undefined && { fecha_fin: fin }),
  };
}

export function leerFiltrosAgregados(
  consulta: Record<string, unknown>,
): FiltrosAgregados {
  const filtros = leerRango(consulta);
  const unidad = consulta.id_unidad_temporal;
  if (unidad !== undefined && (typeof unidad !== 'string' || !isUUID(unidad)))
    throw new ConsultaFiltradaException('UNIDAD_TEMPORAL_NO_ENCONTRADA');
  const modalidad = consulta.modalidad_terapeutica;
  if (
    modalidad !== undefined &&
    modalidad !== 'TODAS' &&
    modalidad !== 'GRUPAL' &&
    modalidad !== 'PERSONALIZADA'
  )
    throw new ConsultaFiltradaException('FILTRO_MODALIDAD_INVALIDO');
  return {
    ...filtros,
    ...(typeof unidad === 'string' && {
      id_unidad_temporal: unidad.toLowerCase(),
    }),
    ...((modalidad === 'GRUPAL' || modalidad === 'PERSONALIZADA') && {
      modalidad_terapeutica: modalidad,
    }),
  };
}

export function leerVistaObjetivo(valor: unknown): ObjetivoVistaAgregada {
  if (valor === undefined || valor === 'TODAS') return 'TODAS';
  const vista = Object.values(TipoVistaAgregada).find((tipo) => tipo === valor);
  if (!vista) throw new ConsultaFiltradaException('VISTA_OBJETIVO_INVALIDA');
  return vista;
}

export function leerComparacion(
  consulta: Record<string, unknown>,
): ConsultaComparacionCohortes {
  if (consulta.ids !== undefined && typeof consulta.ids !== 'string')
    throw new ConsultaFiltradaException('COHORTES_INVALIDAS');
  const seleccion =
    consulta.ids
      ?.split(',', MAX_COHORTES + 1)
      .map((id) => id.trim().toLowerCase()) ?? [];
  if (seleccion.length > MAX_COHORTES)
    throw new ConsultaFiltradaException('LIMITE_COHORTES_EXCEDIDO');
  const ids = [...new Set(seleccion.filter((id) => id.length > 0))];
  if (ids.length < 2)
    throw new ConsultaFiltradaException('COHORTES_INSUFICIENTES');
  if (ids.some((id) => !isUUID(id)) || seleccion.some((id) => id.length === 0))
    throw new ConsultaFiltradaException('COHORTES_INVALIDAS');

  const solicitados = consulta.indicadores;
  const indicadores =
    solicitados === undefined
      ? [...INDICADORES_COMPARACION]
      : leerIndicadores(solicitados);

  return {
    ids,
    indicadores,
    filtros: leerRango(consulta),
    intentoExtraccion: Object.keys(consulta).some(
      (parametro) => !PARAMETROS_COMPARACION.has(parametro),
    ),
  };
}

function leerIndicadores(valor: unknown): IndicadorComparacion[] {
  if (typeof valor !== 'string')
    throw new ConsultaFiltradaException('INDICADORES_INVALIDOS');
  const indicadores = valor.split(',').map((indicador) => indicador.trim());
  const validos = indicadores.filter(
    (indicador): indicador is IndicadorComparacion =>
      INDICADORES_COMPARACION.some((posible) => posible === indicador),
  );
  if (validos.length !== indicadores.length)
    throw new ConsultaFiltradaException('INDICADORES_INVALIDOS');
  return [...new Set(validos)];
}
