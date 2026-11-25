import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  type AlertaM05,
  type AlertaParticipanteM05,
  type ListaAlertasDto,
  type PerfilSeguimientoDto,
  SeguimientoIndividualPort,
} from '../../application/ports/seguimiento-individual.port';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

/** Código ajeno que se devuelve al simular una inconsistencia de M05. */
export const CODIGO_INCONSISTENTE_M05 = 'P-00000000';

/** Alertas de muestra de los contratos de RF-128 y RF-129 (sin id). */
const ALERTAS_MUESTRA: (Omit<AlertaM05, 'id_alerta'> & { clave: string })[] = [
  {
    clave: 'inactividad',
    tipo_alerta: 'INACTIVIDAD',
    fuente_alerta: 'RF-68',
    fecha_generacion: '2026-11-20T14:00:00Z',
    estado_resolucion: 'ACTIVA',
    fecha_resolucion: null,
  },
  {
    clave: 'craving',
    tipo_alerta: 'CRAVING_ELEVADO',
    fuente_alerta: 'RF-63',
    fecha_generacion: '2026-11-12T22:15:00Z',
    estado_resolucion: 'ATENDIDA',
    fecha_resolucion: '2026-11-13T09:00:00Z',
  },
];

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

function alertasDe(codigoParticipante: string): AlertaM05[] {
  return ALERTAS_MUESTRA.map(({ clave, ...alerta }) => ({
    ...alerta,
    id_alerta: idAlertaMuestra(codigoParticipante, clave),
  }));
}

/**
 * Sustituto de M05 mientras no exponga RF-77 / RF-63 / RF-68. Devuelve los
 * datos de muestra de los contratos de RF-128 y RF-129 para el participante
 * solicitado: una alerta de inactividad ACTIVA y una de craving ya ATENDIDA.
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
    const [inactividad] = alertasDe(codigoParticipante);
    return {
      codigo_participante: this.codigoRespuesta(codigoParticipante),
      indicadores_adherencia: { tasa_adherencia: 0.68, dias_con_registro: 17 },
      indicadores_progreso: {
        nivel_progreso: 'EN_AVANCE',
        unidades_completadas: 4,
      },
      tendencia_consumo: 'REDUCCION',
      alertas_activas: [
        {
          id_alerta: inactividad.id_alerta,
          tipo_alerta: inactividad.tipo_alerta,
          fecha_generacion: inactividad.fecha_generacion,
          estado_resolucion: 'ACTIVA',
        },
      ],
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
    const alertas = alertasDe(codigoParticipante);
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
    const alerta = alertasDe(codigoParticipante).find(
      (candidata) => candidata.id_alerta === idAlerta.toLowerCase(),
    );
    return alerta
      ? {
          codigo_participante: this.codigoRespuesta(codigoParticipante),
          alerta,
        }
      : null;
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
