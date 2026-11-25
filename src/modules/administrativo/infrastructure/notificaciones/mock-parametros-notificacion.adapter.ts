import { Injectable } from '@nestjs/common';
import {
  type FranjaHoraria,
  type ParametrosNotificacion,
  ParametrosNotificacionPort,
} from '../../application/ports/parametros-notificacion.port';
import {
  type CambioConfiguracionAplicado,
  RechazoConfiguracionError,
} from '../../application/ports/rechazo-configuracion';
import type { TipoParametroNotificacion } from '../../domain/enums/tipo-parametro-notificacion.enum';
import type { ValorConfiguracion } from '../../domain/results/valor-configuracion';
import { sonValoresEquivalentes } from '../../domain/policies/configuracion-global.policy';
import { flagActivo, simularLlamada } from '../simulacion/simular-modulo';

/** RF-87: cupos diarios reservados para PREVENCION_RECAIDA. */
const CUPOS_RESERVADOS_PREVENCION = 1;

const SEGMENTOS = ['MANANA', 'TARDE', 'NOCHE'] as const;

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/u;

/** Valores por defecto de RF-87, RF-88 y RF-89. */
function parametrosPorDefecto(): ParametrosNotificacion {
  return {
    LIMITE_DIARIO: { dias_habiles: 2, fines_semana: 3 },
    INTERVALO_MINIMO: { horas: 3 },
    FRANJAS_HORARIAS: [
      franja('MANANA', '07:00', '11:59'),
      franja('TARDE', '12:00', '17:59'),
      franja('NOCHE', '18:00', '21:59'),
    ],
  };
}

function franja(
  segmento: FranjaHoraria['segmento'],
  hora_inicio: string,
  hora_fin: string,
): FranjaHoraria {
  return {
    segmento,
    hora_inicio,
    hora_fin,
    habilitada_dias_habiles: true,
    habilitada_fines_semana: true,
  };
}

const rechazo = (status: 400 | 409, codigo: string, mensaje: string) =>
  new RechazoConfiguracionError(status, codigo, mensaje);

const valorInvalido = () =>
  rechazo(
    400,
    'VALOR_PARAMETRO_INVALIDO',
    'El valor ingresado no es válido para este parámetro. Verifique el rango permitido.',
  );

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

const tieneSoloClaves = (valor: Record<string, unknown>, claves: string[]) =>
  Object.keys(valor).length === claves.length &&
  claves.every((clave) => clave in valor);

const enteroPositivo = (valor: unknown): valor is number =>
  typeof valor === 'number' && Number.isInteger(valor) && valor > 0;

/** RF-87: enteros positivos, no menores que el cupo reservado de prevención. */
function validarLimiteDiario(valor: unknown): void {
  const valido =
    esObjeto(valor) &&
    tieneSoloClaves(valor, ['dias_habiles', 'fines_semana']) &&
    [valor.dias_habiles, valor.fines_semana].every(
      (limite) =>
        enteroPositivo(limite) && limite >= CUPOS_RESERVADOS_PREVENCION,
    );
  if (!valido) throw valorInvalido();
}

/** RF-88: entero positivo de horas. */
function validarIntervaloMinimo(valor: unknown): void {
  const valido =
    esObjeto(valor) &&
    tieneSoloClaves(valor, ['horas']) &&
    enteroPositivo(valor.horas);
  if (!valido) throw valorInvalido();
}

const minutos = (hora: string) =>
  Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

/** RF-89: validaciones de franjas, con sus códigos y mensajes. */
function validarFranjas(valor: unknown): void {
  const claves = [
    'segmento',
    'hora_inicio',
    'hora_fin',
    'habilitada_dias_habiles',
    'habilitada_fines_semana',
  ];
  if (
    !Array.isArray(valor) ||
    valor.length !== SEGMENTOS.length ||
    !valor.every(
      (f) =>
        esObjeto(f) &&
        tieneSoloClaves(f, claves) &&
        typeof f.hora_inicio === 'string' &&
        typeof f.hora_fin === 'string' &&
        typeof f.habilitada_dias_habiles === 'boolean' &&
        typeof f.habilitada_fines_semana === 'boolean',
    )
  )
    throw valorInvalido();
  const franjas = valor as FranjaHoraria[];
  const segmentos = new Set(franjas.map((f) => f.segmento));
  if (!SEGMENTOS.every((s) => segmentos.has(s))) throw valorInvalido();

  if (!franjas.every((f) => HORA.test(f.hora_inicio) && HORA.test(f.hora_fin)))
    throw rechazo(
      400,
      'FORMATO_HORA_INVALIDO',
      'El formato de hora ingresado no es válido. Utilice el formato HH:MM en el rango 00:00 a 23:59.',
    );

  const invertida = franjas.find(
    (f) => minutos(f.hora_inicio) >= minutos(f.hora_fin),
  );
  if (invertida)
    throw rechazo(
      400,
      'HORARIO_FRANJA_INVALIDO',
      `La hora de inicio de la franja debe ser anterior a su hora de fin. Verifique la configuración de la franja ${invertida.segmento}.`,
    );

  // Rangos inclusivos (07:00–11:59 y 12:00–17:59 no se solapan).
  const solapadas = franjas.some((a, i) =>
    franjas
      .slice(i + 1)
      .some(
        (b) =>
          minutos(a.hora_inicio) <= minutos(b.hora_fin) &&
          minutos(b.hora_inicio) <= minutos(a.hora_fin),
      ),
  );
  if (solapadas)
    throw rechazo(
      409,
      'FRANJAS_SOLAPADAS',
      'Las franjas horarias no pueden solaparse.',
    );

  if (
    !franjas.some((f) => f.habilitada_dias_habiles) ||
    !franjas.some((f) => f.habilitada_fines_semana)
  )
    throw rechazo(
      400,
      'SIN_FRANJA_HABILITADA',
      'Debe habilitar al menos una franja horaria para días hábiles y al menos una para fines de semana.',
    );
}

const VALIDACIONES: Record<TipoParametroNotificacion, (v: unknown) => void> = {
  LIMITE_DIARIO: validarLimiteDiario,
  INTERVALO_MINIMO: validarIntervaloMinimo,
  FRANJAS_HORARIAS: validarFranjas,
};

/**
 * Sustituto de M07 (RF-87, RF-88, RF-89) mientras no exista: guarda los
 * parámetros globales en memoria, con los valores por defecto de esos RF
 * (límite 2 hábiles / 3 fines de semana, intervalo 3 h, franjas MANANA 07:00–
 * 11:59, TARDE 12:00–17:59 y NOCHE 18:00–21:59), y aplica sus validaciones.
 *
 * Variables de entorno (se leen en cada llamada, para poder probar):
 * - `SIMULAR_M7_CAIDO=true`: M07 no responde (503 en lectura, 500 al guardar).
 * - `SIMULAR_FALLO_GUARDADO_M7=true`: la lectura funciona, el guardado falla.
 * - `MOCK_M7_DELAY_MS`: retardo simulado de red (por omisión 150 ms).
 */
@Injectable()
export class MockParametrosNotificacionAdapter implements ParametrosNotificacionPort {
  private parametros = parametrosPorDefecto();

  async obtenerParametros(): Promise<ParametrosNotificacion> {
    await this.simularRed();
    return structuredClone(this.parametros);
  }

  // El cuarto argumento (actor) lo usará M07 para registrar quién hizo el
  // cambio; el mock no lo necesita.
  async actualizarParametro(
    tipo: TipoParametroNotificacion,
    valorNuevo: unknown,
    valorAnteriorEsperado: unknown,
  ): Promise<CambioConfiguracionAplicado<ValorConfiguracion>> {
    await this.simularRed();
    const anterior = this.parametros[tipo];
    if (!sonValoresEquivalentes(anterior, valorAnteriorEsperado))
      throw rechazo(
        409,
        'CONFIGURACION_MODIFICADA',
        'El valor cambió desde que lo consultó. Recargue y vuelva a intentarlo.',
      );
    VALIDACIONES[tipo](valorNuevo);
    if (flagActivo('SIMULAR_FALLO_GUARDADO_M7'))
      throw new Error('No fue posible guardar la configuración del parámetro.');

    this.parametros = {
      ...this.parametros,
      [tipo]: structuredClone(valorNuevo),
    };
    return {
      valor_anterior: structuredClone(anterior),
      valor_vigente: structuredClone(this.parametros[tipo]),
      fecha_actualizacion: new Date().toISOString(),
    };
  }

  private simularRed(): Promise<void> {
    return simularLlamada({
      variableRetardo: 'MOCK_M7_DELAY_MS',
      variableCaido: 'SIMULAR_M7_CAIDO',
      modulo: 'M07',
    });
  }
}
