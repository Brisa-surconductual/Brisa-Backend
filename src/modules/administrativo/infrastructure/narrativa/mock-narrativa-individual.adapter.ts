import { Injectable } from '@nestjs/common';
import {
  NarrativaIndividualPort,
  type ProgresionNarrativaM06,
} from '../../application/ports/narrativa-individual.port';
import { FaseNarrativa } from '../../domain/enums/fase-narrativa.enum';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

/** Usuario ajeno que se devuelve al simular una inconsistencia de M06. */
export const ID_USUARIO_INCONSISTENTE_M06 =
  '00000000-0000-4000-8000-000000000006';

/**
 * Sustituto de M06 mientras no exponga RF-116. Devuelve los datos de muestra
 * del contrato de RF-130 para el usuario solicitado: fase DESARROLLO, un
 * capítulo completado y el logro "Primer paso".
 *
 * Variables de entorno (se leen en cada llamada, para poder probar):
 * - `SIMULAR_M6_CAIDO=true`: M06 no responde (503).
 * - `SIMULAR_INCONSISTENCIA_M6=true`: M06 responde con otro usuario (409).
 * - `SIMULAR_M6_SIN_DATOS=true`: el usuario no tiene perfil narrativo (204).
 * - `SIMULAR_M6_PROGRESION_INICIAL=true`: perfil recién inicializado, sin
 *   capítulos completados ni logros (200).
 * - `MOCK_M6_DELAY_MS`: retardo simulado de red (por omisión 150 ms).
 */
@Injectable()
export class MockNarrativaIndividualAdapter implements NarrativaIndividualPort {
  async obtenerProgresionNarrativa(
    idUsuario: string,
  ): Promise<ProgresionNarrativaM06 | null> {
    await simularLlamada({
      variableRetardo: 'MOCK_M6_DELAY_MS',
      variableCaido: 'SIMULAR_M6_CAIDO',
      modulo: 'M06',
    });
    if (flagActivo('SIMULAR_M6_SIN_DATOS')) return null;

    const id_usuario = flagActivo('SIMULAR_INCONSISTENCIA_M6')
      ? ID_USUARIO_INCONSISTENTE_M06
      : idUsuario;
    const base = {
      id_usuario,
      id_perfil_narrativo: '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b',
    };

    if (flagActivo('SIMULAR_M6_PROGRESION_INICIAL'))
      return {
        ...base,
        id_fase_activa: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
        nombre_fase_activa: FaseNarrativa.INICIO,
        id_capitulo_completado: null,
        nivel_gamificacion_actual: 1,
        logros_narrativos_desbloqueados: [],
        fecha_actualizacion_progresion: '2026-10-01T08:00:00Z',
        estado_progresion_narrativa: 'INICIAL',
      };

    return {
      ...base,
      id_fase_activa: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
      nombre_fase_activa: FaseNarrativa.DESARROLLO,
      id_capitulo_completado: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
      nivel_gamificacion_actual: 3,
      logros_narrativos_desbloqueados: [
        {
          id_logro: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
          nombre_logro: 'Primer paso',
          fecha_desbloqueo: '2026-10-30T18:00:00Z',
        },
      ],
      fecha_actualizacion_progresion: '2026-11-22T05:00:00Z',
      estado_progresion_narrativa: 'ACTIVA',
    };
  }
}
