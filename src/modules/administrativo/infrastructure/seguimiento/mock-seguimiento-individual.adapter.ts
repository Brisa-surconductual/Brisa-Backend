import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  type AlertaM05,
  type AlertaParticipanteM05,
  type IndicadoresParticipanteM05,
  type ListaAlertasDto,
  type PerfilSeguimientoDto,
  SeguimientoIndividualPort,
} from '../../application/ports/seguimiento-individual.port';
import {
  NIVELES_PROGRESO,
  type NivelProgreso,
} from '../../domain/enums/nivel-progreso.enum';
import type { TendenciaConsumo } from '../../domain/enums/tendencia-consumo.enum';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

/** Código ajeno que se devuelve al simular una inconsistencia de M05. */
export const CODIGO_INCONSISTENTE_M05 = 'P-00000000';

const UNIDADES_POR_NIVEL: Record<NivelProgreso, number> = {
  INICIAL: 1,
  EN_AVANCE: 4,
  AVANZADO: 7,
  COMPLETADO: 10,
};

const TENDENCIAS: TendenciaConsumo[] = ['REDUCCION', 'ESTABLE', 'INCREMENTO'];

/**
 * Id de alerta estable y propio de cada participante. En M05 cada alerta tiene
 * un id único; si el mock repitiera los mismos ids para todos, atender una
 * alerta de un participante (índice único `uq_alerta_externo`) bloquearía la
 * misma alerta de muestra en todos los demás.
 */
export function idAlertaMuestra(codigoParticipante: string, clave: string) {
  const h = createHash('sha256')
    .update(`${codigoParticipante}:${clave}`)
    .digest('hex');
  const variante = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variante}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Datos de muestra de un participante, iguales en todas las consultas. */
export interface MuestraParticipante {
  nivel_progreso: NivelProgreso;
  unidades_completadas: number;
  tasa_adherencia: number;
  dias_con_registro: number;
  tendencia_consumo: TendenciaConsumo;
  /** Historial de alertas (las de estado ACTIVA son las activas). */
  alertas: AlertaM05[];
}

/**
 * Indicadores de muestra deterministas para cada código: el mismo código da
 * siempre los mismos datos, y códigos distintos dan datos distintos (para que
 * el listado de RF-142 se pueda filtrar y ordenar). Perfil (RF-128),
 * historial (RF-129), atención de alertas (RF-147) y listado (RF-142) se
 * construyen desde aquí, así que siempre coinciden.
 *
 * Escenarios de alertas: sin alertas activas (inactividad ya RESUELTA), solo
 * la de inactividad ACTIVA, o inactividad y craving ACTIVAS.
 */
export function muestraParticipante(
  codigoParticipante: string,
): MuestraParticipante {
  const h = createHash('sha256')
    .update(`muestra:${codigoParticipante}`)
    .digest('hex');
  const nivel = NIVELES_PROGRESO[parseInt(h.slice(0, 2), 16) % 4];
  const tasa = Math.round((parseInt(h.slice(2, 6), 16) / 0xffff) * 100) / 100;
  const escenario = parseInt(h.slice(7, 8), 16) % 3;

  const inactividad: AlertaM05 = {
    id_alerta: idAlertaMuestra(codigoParticipante, 'inactividad'),
    tipo_alerta: 'INACTIVIDAD',
    fuente_alerta: 'RF-68',
    fecha_generacion: '2026-11-20T14:00:00Z',
    estado_resolucion: escenario === 0 ? 'RESUELTA' : 'ACTIVA',
    fecha_resolucion: escenario === 0 ? '2026-11-21T08:00:00Z' : null,
  };
  const craving: AlertaM05 = {
    id_alerta: idAlertaMuestra(codigoParticipante, 'craving'),
    tipo_alerta: 'CRAVING_ELEVADO',
    fuente_alerta: 'RF-63',
    fecha_generacion: '2026-11-12T22:15:00Z',
    estado_resolucion: escenario === 2 ? 'ACTIVA' : 'ATENDIDA',
    fecha_resolucion: escenario === 2 ? null : '2026-11-13T09:00:00Z',
  };

  return {
    nivel_progreso: nivel,
    unidades_completadas: UNIDADES_POR_NIVEL[nivel],
    tasa_adherencia: tasa,
    dias_con_registro: Math.round(tasa * 25),
    tendencia_consumo: TENDENCIAS[parseInt(h.slice(6, 7), 16) % 3],
    alertas: [inactividad, craving],
  };
}

const activas = (alertas: AlertaM05[]) =>
  alertas.filter((alerta) => alerta.estado_resolucion === 'ACTIVA');

/**
 * Sustituto de M05 mientras no exponga RF-77 / RF-63 / RF-68. Devuelve, para
 * cada participante, los datos deterministas de `muestraParticipante`, con la
 * forma de los contratos de RF-128, RF-129, RF-147 y RF-142.
 *
 * Variables de entorno (se leen en cada llamada, para poder probar):
 * - `SIMULAR_M5_CAIDO=true`: M05 no responde (503).
 * - `SIMULAR_INCONSISTENCIA_M5=true`: M05 responde con otro participante (409).
 * - `SIMULAR_M5_SIN_DATOS=true`: M05 no tiene datos del participante (204/404).
 * - `MOCK_M5_DELAY_MS`: retardo simulado de red (por omisión 150 ms).
 */
@Injectable()
export class MockSeguimientoIndividualAdapter implements SeguimientoIndividualPort {
  async obtenerPerfilSeguimiento(
    codigoParticipante: string,
  ): Promise<PerfilSeguimientoDto | null> {
    await this.simularRed();
    if (flagActivo('SIMULAR_M5_SIN_DATOS')) return null;
    const muestra = muestraParticipante(codigoParticipante);
    return {
      codigo_participante: this.codigoRespuesta(codigoParticipante),
      indicadores_adherencia: {
        tasa_adherencia: muestra.tasa_adherencia,
        dias_con_registro: muestra.dias_con_registro,
      },
      indicadores_progreso: {
        nivel_progreso: muestra.nivel_progreso,
        unidades_completadas: muestra.unidades_completadas,
      },
      tendencia_consumo: muestra.tendencia_consumo,
      alertas_activas: activas(muestra.alertas).map((alerta) => ({
        id_alerta: alerta.id_alerta,
        tipo_alerta: alerta.tipo_alerta,
        fecha_generacion: alerta.fecha_generacion,
        estado_resolucion: 'ACTIVA',
      })),
      fecha_actualizacion: '2026-11-22T05:00:00Z',
    };
  }

  async obtenerAlertasParticipante(
    codigoParticipante: string,
    offset: number,
    limit: number,
  ): Promise<ListaAlertasDto | null> {
    await this.simularRed();
    if (flagActivo('SIMULAR_M5_SIN_DATOS')) return null;
    const { alertas } = muestraParticipante(codigoParticipante);
    return {
      codigo_participante: this.codigoRespuesta(codigoParticipante),
      items: alertas.slice(offset, offset + limit),
      total: alertas.length,
    };
  }

  async obtenerAlerta(
    codigoParticipante: string,
    idAlerta: string,
  ): Promise<AlertaParticipanteM05 | null> {
    await this.simularRed();
    if (flagActivo('SIMULAR_M5_SIN_DATOS')) return null;
    const alerta = muestraParticipante(codigoParticipante).alertas.find(
      (candidata) => candidata.id_alerta === idAlerta.toLowerCase(),
    );
    return alerta
      ? {
          codigo_participante: this.codigoRespuesta(codigoParticipante),
          alerta,
        }
      : null;
  }

  async obtenerIndicadoresLote(
    codigosParticipante: string[],
  ): Promise<IndicadoresParticipanteM05[]> {
    // Una sola espera de red para todo el lote.
    await this.simularRed();
    if (flagActivo('SIMULAR_M5_SIN_DATOS')) return [];
    return codigosParticipante.map((codigo) => {
      const muestra = muestraParticipante(codigo);
      return {
        codigo_participante: this.codigoRespuesta(codigo),
        nivel_progreso: muestra.nivel_progreso,
        tasa_adherencia: muestra.tasa_adherencia,
        alertas_activas: activas(muestra.alertas).map((alerta) => ({
          id_alerta: alerta.id_alerta,
          tipo_alerta: alerta.tipo_alerta,
          estado_resolucion: alerta.estado_resolucion,
        })),
      };
    });
  }

  private codigoRespuesta(codigoParticipante: string): string {
    return flagActivo('SIMULAR_INCONSISTENCIA_M5')
      ? CODIGO_INCONSISTENTE_M05
      : codigoParticipante;
  }

  private simularRed(): Promise<void> {
    return simularLlamada({
      variableRetardo: 'MOCK_M5_DELAY_MS',
      variableCaido: 'SIMULAR_M5_CAIDO',
      modulo: 'M05',
    });
  }
}
