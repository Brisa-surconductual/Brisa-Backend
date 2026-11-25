import { Injectable } from '@nestjs/common';
import {
  type InteraccionNotificacionesM07,
  NotificacionesIndividualPort,
} from '../../application/ports/notificaciones-individual.port';
import { NO_CALCULABLE } from '../../domain/policies/tasa-notificacion.policy';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

/** Usuario ajeno que se devuelve al simular una inconsistencia de M07. */
export const ID_USUARIO_INCONSISTENTE_M07 =
  '00000000-0000-4000-8000-000000000007';

/**
 * Sustituto de M07 mientras no exponga RF-98 / RF-100. Devuelve los datos de
 * muestra del contrato de RF-131 para el usuario solicitado, sin importar el
 * periodo: 120 enviadas, 114 entregadas, 70 abiertas, 44 descartadas y 31
 * sesiones; tasa de descarte aún no calculada por M07.
 *
 * Variables de entorno (se leen en cada llamada, para poder probar):
 * - `SIMULAR_M7_CAIDO=true`: M07 no responde (503).
 * - `SIMULAR_INCONSISTENCIA_M7=true`: M07 responde con otro usuario (409).
 * - `SIMULAR_M7_SIN_DATOS=true`: el usuario no tiene historial (204).
 * - `SIMULAR_M7_SIN_ENTREGAS=true`: hubo envíos pero ninguna entrega, así que
 *   todas las tasas son no calculables (200 con NO_CALCULABLE).
 * - `MOCK_M7_DELAY_MS`: retardo simulado de red (por omisión 150 ms).
 */
@Injectable()
export class MockNotificacionesIndividualAdapter implements NotificacionesIndividualPort {
  // El mock no filtra por periodo (segundo argumento); M07 sí lo hará.
  async obtenerInteraccion(
    idUsuario: string,
  ): Promise<InteraccionNotificacionesM07 | null> {
    await simularLlamada({
      variableRetardo: 'MOCK_M7_DELAY_MS',
      variableCaido: 'SIMULAR_M7_CAIDO',
      modulo: 'M07',
    });
    if (flagActivo('SIMULAR_M7_SIN_DATOS')) return null;

    const id_usuario = flagActivo('SIMULAR_INCONSISTENCIA_M7')
      ? ID_USUARIO_INCONSISTENTE_M07
      : idUsuario;

    if (flagActivo('SIMULAR_M7_SIN_ENTREGAS'))
      return {
        id_usuario,
        total_notificaciones_enviadas: 6,
        total_notificaciones_entregadas: 0,
        total_notificaciones_abiertas: 0,
        total_notificaciones_descartadas: 0,
        total_sesiones_desde_notificacion: 0,
        tasa_apertura: NO_CALCULABLE,
        tasa_conversion: NO_CALCULABLE,
        tasa_descarte: NO_CALCULABLE,
      };

    return {
      id_usuario,
      total_notificaciones_enviadas: 120,
      total_notificaciones_entregadas: 114,
      total_notificaciones_abiertas: 70,
      total_notificaciones_descartadas: 44,
      total_sesiones_desde_notificacion: 31,
      tasa_apertura: 0.61,
      tasa_conversion: 0.27,
      tasa_descarte: NO_CALCULABLE,
    };
  }
}
