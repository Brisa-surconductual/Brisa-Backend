import { Injectable } from '@nestjs/common';
import {
  type CambioConfiguracionAplicado,
  RechazoConfiguracionError,
} from '../../application/ports/rechazo-configuracion';
import {
  type UmbralVigente,
  UmbralesSeguimientoPort,
} from '../../application/ports/umbrales-seguimiento.port';
import type { ValorConfiguracion } from '../../domain/results/valor-configuracion';
import { sonValoresEquivalentes } from '../../domain/policies/configuracion-global.policy';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

const NIVELES_PROGRESO = [
  'INICIAL',
  'EN_AVANCE',
  'AVANZADO',
  'COMPLETADO',
] as const;

const FECHA_INICIAL = '2026-11-01T12:00:00Z';

/** Valores por defecto de RF-63, RF-68 y RF-70. */
function umbralesPorDefecto(): UmbralVigente[] {
  return [
    {
      tipo_umbral: 'CRAVING_ELEVADO',
      valor: 3,
      unidad_medida: 'puntaje',
      fecha_actualizacion: FECHA_INICIAL,
    },
    {
      tipo_umbral: 'INACTIVIDAD',
      valor: 7,
      unidad_medida: 'dias',
      fecha_actualizacion: FECHA_INICIAL,
    },
    {
      tipo_umbral: 'CLASIFICACION_PROGRESO',
      valor: [
        { nivel: 'INICIAL', min: 0, max: 25 },
        { nivel: 'EN_AVANCE', min: 25, max: 50 },
        { nivel: 'AVANZADO', min: 50, max: 75 },
        { nivel: 'COMPLETADO', min: 75, max: 100 },
      ],
      unidad_medida: 'porcentaje',
      fecha_actualizacion: FECHA_INICIAL,
    },
  ];
}

const esEntero = (valor: unknown): valor is number =>
  typeof valor === 'number' && Number.isInteger(valor);

/** RF-70: 4 niveles en orden, contiguos y que cubren [0, 100] sin huecos. */
function rangosProgresoValidos(valor: unknown): boolean {
  if (!Array.isArray(valor) || valor.length !== NIVELES_PROGRESO.length)
    return false;
  let limiteAnterior = 0;
  return valor.every((rango: unknown, i) => {
    if (rango === null || typeof rango !== 'object') return false;
    const { nivel, min, max, ...resto } = rango as Record<string, unknown>;
    const valido =
      Object.keys(resto).length === 0 &&
      nivel === NIVELES_PROGRESO[i] &&
      typeof min === 'number' &&
      typeof max === 'number' &&
      min === limiteAnterior &&
      max > min &&
      (i < NIVELES_PROGRESO.length - 1 || max === 100);
    if (valido) limiteAnterior = max;
    return valido;
  });
}

/** Reglas de rango de RF-79 por tipo de umbral. */
const VALIDACIONES: Record<string, (valor: unknown) => boolean> = {
  // RF-63: entero dentro de la escala 1 a 5 de RF-103.
  CRAVING_ELEVADO: (valor) => esEntero(valor) && valor >= 1 && valor <= 5,
  // RF-68: días consecutivos sin interacción, entero positivo.
  INACTIVIDAD: (valor) => esEntero(valor) && valor >= 1,
  CLASIFICACION_PROGRESO: rangosProgresoValidos,
};

/**
 * Sustituto de M05 (RF-79) mientras no exista: guarda los umbrales en memoria,
 * con los valores por defecto de RF-63 (craving 3, escala 1–5), RF-68
 * (inactividad 7 días) y RF-70 (rangos de progreso 0–100), y aplica sus
 * reglas de validación.
 *
 * Variables de entorno (se leen en cada llamada, para poder probar):
 * - `SIMULAR_M5_CAIDO=true`: M05 no responde (503 en lectura, 500 al guardar).
 * - `SIMULAR_FALLO_GUARDADO_M5=true`: la lectura funciona, el guardado falla.
 * - `MOCK_M5_DELAY_MS`: retardo simulado de red (por omisión 150 ms).
 */
@Injectable()
export class MockUmbralesSeguimientoAdapter implements UmbralesSeguimientoPort {
  private readonly umbrales = new Map(
    umbralesPorDefecto().map((umbral) => [umbral.tipo_umbral, umbral]),
  );

  async listarUmbrales(): Promise<UmbralVigente[]> {
    await this.simularRed();
    return [...this.umbrales.values()].map((umbral) => structuredClone(umbral));
  }

  async obtenerUmbral(tipoUmbral: string): Promise<UmbralVigente | null> {
    await this.simularRed();
    const umbral = this.umbrales.get(tipoUmbral);
    return umbral ? structuredClone(umbral) : null;
  }

  // El cuarto argumento (actor) lo usará M05 para registrar quién hizo el
  // cambio; el mock no lo necesita.
  async actualizarUmbral(
    tipoUmbral: string,
    valorNuevo: unknown,
    valorAnteriorEsperado: unknown,
  ): Promise<CambioConfiguracionAplicado<ValorConfiguracion>> {
    await this.simularRed();
    const umbral = this.umbrales.get(tipoUmbral);
    if (!umbral)
      throw new RechazoConfiguracionError(
        404,
        'TIPO_UMBRAL_INEXISTENTE',
        'El tipo de umbral seleccionado no existe.',
      );
    if (!sonValoresEquivalentes(umbral.valor, valorAnteriorEsperado))
      throw new RechazoConfiguracionError(
        409,
        'CONFIGURACION_MODIFICADA',
        'El valor cambió desde que lo consultó. Recargue y vuelva a intentarlo.',
      );
    if (!VALIDACIONES[tipoUmbral](valorNuevo))
      throw new RechazoConfiguracionError(
        400,
        'VALOR_UMBRAL_INVALIDO',
        'El valor ingresado no es válido para este umbral. Verifique el rango permitido.',
      );
    if (flagActivo('SIMULAR_FALLO_GUARDADO_M5'))
      throw new Error('No fue posible guardar la configuración del umbral.');

    const anterior = umbral.valor;
    const actualizado: UmbralVigente = {
      ...umbral,
      valor: structuredClone(valorNuevo as ValorConfiguracion),
      fecha_actualizacion: new Date().toISOString(),
    };
    this.umbrales.set(tipoUmbral, actualizado);
    return {
      valor_anterior: structuredClone(anterior),
      valor_vigente: structuredClone(actualizado.valor),
      fecha_actualizacion: actualizado.fecha_actualizacion,
    };
  }

  private simularRed(): Promise<void> {
    return simularLlamada({
      variableRetardo: 'MOCK_M5_DELAY_MS',
      variableCaido: 'SIMULAR_M5_CAIDO',
      modulo: 'M05',
    });
  }
}
