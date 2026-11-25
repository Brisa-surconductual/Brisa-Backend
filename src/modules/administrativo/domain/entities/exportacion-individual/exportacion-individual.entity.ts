import { AccionAdministrativa } from '../../enums/accion-administrativa.enum';
import type { NivelProgreso } from '../../enums/nivel-progreso.enum';
import { RecursoAuditado } from '../../enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../enums/severidad-auditoria.enum';
import type { AccionAuditable } from '../../results/accion-auditable';
import {
  campoCsv,
  type CeldaCsv,
  SIN_DATO_CSV,
} from '../../value-objects/campo-csv.vo';

/**
 * Columnas fijas del CSV individual (RF-145), en orden. Solo métricas
 * cuantitativas: sin seudónimo, sin texto de diario ni de chat.
 */
export const COLUMNAS_EXPORTACION_INDIVIDUAL = [
  'orden_unidad_temporal',
  'nombre_unidad',
  'fecha_inicio_unidad',
  'fecha_fin_unidad',
  'nivel_progreso',
  'tasa_adherencia',
  'craving_promedio',
  'alertas_generadas',
  'alertas_atendidas',
] as const;

export type ColumnaExportacionIndividual =
  (typeof COLUMNAS_EXPORTACION_INDIVIDUAL)[number];

/** Una fila del historial por unidad temporal; null = dato no disponible. */
export interface FilaExportacionIndividual {
  orden_unidad_temporal: number;
  nombre_unidad: string;
  fecha_inicio_unidad: string;
  fecha_fin_unidad: string;
  nivel_progreso: NivelProgreso | null;
  tasa_adherencia: number | null;
  craving_promedio: number | null;
  alertas_generadas: number;
  alertas_atendidas: number;
}

export const TIPO_EXPORTACION_INDIVIDUAL = 'EXPORTACION_INDIVIDUAL' as const;

/** Acción que se audita en toda exportación CSV individual (RF-145). */
export function accionExportacionIndividual(): AccionAuditable {
  return {
    accion: AccionAdministrativa.EXPORTACION_DATOS,
    recurso: RecursoAuditado.EXPORTACION_CSV_INDIVIDUAL,
    severidad: SeveridadAuditoria.ALTA,
    detalle: { tipo: TIPO_EXPORTACION_INDIVIDUAL },
  };
}

const celda = (valor: CeldaCsv | null): string =>
  campoCsv(valor ?? SIN_DATO_CSV);

/**
 * CSV individual (RF-145): RFC 4180, UTF-8 con BOM (para que Excel muestre
 * bien las tildes), separador coma y fin de línea CRLF. Cada fila se arma con
 * la lista blanca de columnas: nada que no esté en ella llega al archivo.
 */
export function generarCsvIndividual(
  filas: readonly FilaExportacionIndividual[],
): string {
  const lineas = [
    COLUMNAS_EXPORTACION_INDIVIDUAL.join(','),
    ...filas.map((fila) =>
      COLUMNAS_EXPORTACION_INDIVIDUAL.map((columna) =>
        celda(fila[columna]),
      ).join(','),
    ),
  ];
  return '\uFEFF' + lineas.map((linea) => linea + '\r\n').join('');
}
