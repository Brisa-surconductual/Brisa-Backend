import { AccionAdministrativa } from '../../enums/accion-administrativa.enum';
import { COLUMNAS_EXPORTACION_COHORTE } from '../../enums/columna-exportacion-cohorte.enum';
import type { ColumnaExportacionCohorte } from '../../enums/columna-exportacion-cohorte.enum';
import { EstadoVistaAgregada } from '../../enums/estado-vista-agregada.enum';
import { NivelProgreso } from '../../enums/nivel-progreso.enum';
import { RecursoAuditado } from '../../enums/recurso-auditado.enum';
import type { AccionAuditable } from '../../results/accion-auditable';
import type {
  DatosVistaAgregada,
  VistaAgregada,
} from '../../results/vista-agregada';
import type { VistaConductualExportable } from '../../results/vista-conductual-exportable';
import { campoCsv, SIN_DATO_CSV } from '../../value-objects/campo-csv.vo';
import type { CeldaCsv } from '../../value-objects/campo-csv.vo';
import type { DatosNotificaciones } from '../vistas-agregadas/vista-notificaciones.entity';

type FilaExportacion = Record<ColumnaExportacionCohorte, CeldaCsv>;

/** Acción que se audita en toda exportación CSV de cohorte (RF-144). */
export function accionExportacionCohorte(
  idCohorte: string | null,
): AccionAuditable {
  return {
    accion: AccionAdministrativa.EXPORTACION_DATOS,
    recurso: RecursoAuditado.EXPORTACION_CSV_COHORTE,
    idRecurso: idCohorte,
    detalle: { nombre_archivo: null, tamano_bytes: null },
  };
}

function estadoVista(vista: VistaAgregada<DatosVistaAgregada> | null): string {
  return vista?.datos ? vista.estado : EstadoVistaAgregada.NO_DISPONIBLE;
}

/** Genera el CSV agregado de la cohorte: BOM, encabezado y una fila (RF-144). */
export function generarCsvCohorte(
  nombreCohorte: string,
  conductual: VistaConductualExportable,
  notificaciones: VistaAgregada<DatosNotificaciones> | null,
): string {
  const b = conductual.datos;
  const n = notificaciones?.datos;
  const porNivel = (nivel: NivelProgreso) =>
    b.distribucion_niveles_progreso?.find((fila) => fila.nivel === nivel)
      ?.total_usuarios ?? SIN_DATO_CSV;

  const fila: FilaExportacion = {
    nombre_cohorte: nombreCohorte,
    estado_vista_conductual: estadoVista(conductual),
    fecha_actualizacion_conductual: b.fecha_actualizacion,
    total_usuarios_activos: b.total_usuarios_activos ?? SIN_DATO_CSV,
    usuarios_nivel_inicial: porNivel(NivelProgreso.INICIAL),
    usuarios_nivel_en_avance: porNivel(NivelProgreso.EN_AVANCE),
    usuarios_nivel_avanzado: porNivel(NivelProgreso.AVANZADO),
    usuarios_nivel_completado: porNivel(NivelProgreso.COMPLETADO),
    tasa_adherencia_promedio: b.tasa_adherencia_promedio ?? SIN_DATO_CSV,
    alertas_inactividad_pendientes:
      b.alertas_inactividad_pendientes ?? SIN_DATO_CSV,
    alertas_craving_pendientes: b.alertas_craving_pendientes ?? SIN_DATO_CSV,
    estado_vista_notificaciones: estadoVista(notificaciones),
    fecha_actualizacion_notificaciones: n?.fecha_actualizacion ?? SIN_DATO_CSV,
    tasa_apertura_promedio: n?.tasa_apertura_promedio ?? SIN_DATO_CSV,
    tasa_conversion_promedio: n?.tasa_conversion_promedio ?? SIN_DATO_CSV,
    total_notificaciones_enviadas:
      n?.total_notificaciones_enviadas ?? SIN_DATO_CSV,
    total_notificaciones_entregadas:
      n?.total_notificaciones_entregadas ?? SIN_DATO_CSV,
    total_notificaciones_descartadas:
      n?.total_notificaciones_descartadas ?? SIN_DATO_CSV,
  };

  const valores = COLUMNAS_EXPORTACION_COHORTE.map((columna) =>
    campoCsv(fila[columna]),
  );
  return (
    '﻿' +
    COLUMNAS_EXPORTACION_COHORTE.join(',') +
    '\r\n' +
    valores.join(',') +
    '\r\n'
  );
}
