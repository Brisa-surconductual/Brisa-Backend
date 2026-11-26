import { ReglaValidacion } from '../entities/reglas-validacion/reglas-validacion.entity';
import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../enums/tipo-dato-validacion-enum';
import {
  TipoEntradaRespuesta as Tipo,
  tipoEntradaConfigurado,
} from '../enums/tipo-entrada-respuesta.enum';
import { ReglaValidacionInvalidaException } from '../exceptions';

/** Lo único que el administrador decide: el resto se deriva del nodo origen. */
export interface SolicitudReglaTransicion {
  operador?: Op;
  valorEsperado: unknown;
  mensajeError: string;
}

type Entrada = Record<string, unknown>;

const invalida = (mensaje: string): never => {
  throw new ReglaValidacionInvalidaException(mensaje);
};

export function resolverTipoEntrada(
  contenidoNodo: Record<string, unknown>,
): Tipo {
  const entrada = contenidoNodo?.entrada;
  if (entrada === null || typeof entrada !== 'object') return Tipo.CONTINUAR;
  const campo = entrada as Entrada;
  return (
    tipoEntradaConfigurado(campo.tipo ?? campo.tipo_entrada) ?? Tipo.CONTINUAR
  );
}

/**
 * RF-25: arma la regla propia de una transición a partir del tipo de respuesta
 * del nodo origen. El valor esperado siempre sale de lo que el nodo ya define
 * (sus opciones o su rango): nunca es texto libre. Un nodo sin respuesta
 * (CONTINUAR) no lleva regla y devuelve `null`.
 */
export function construirReglaTransicion(
  contenidoNodo: Record<string, unknown>,
  solicitud: SolicitudReglaTransicion | undefined,
): ReglaValidacion | null {
  const tipo = resolverTipoEntrada(contenidoNodo);

  if (tipo === Tipo.CONTINUAR) {
    if (solicitud !== undefined)
      invalida(
        'Un nodo sin respuesta esperada no lleva regla: su transición es automática.',
      );
    return null;
  }

  if (solicitud === undefined)
    return invalida('La transición debe definir su regla de validación.');

  const entrada = contenidoNodo.entrada as Entrada;
  if (solicitud.operador === Op.SIEMPRE)
    return construirReglaPorDefecto(contenidoNodo, solicitud.mensajeError);

  if (tipo === Tipo.TEXTO_LIBRE || tipo === Tipo.FECHA_HORA)
    invalida(
      'Desde un nodo de texto libre o de fecha u hora solo se puede definir la transición para "cualquier otra respuesta".',
    );

  const obligatorio = entrada.obligatorio !== false;
  const esperado = objeto(solicitud.valorEsperado);
  const regla = (
    tipoDato: Dato,
    operador: Op,
    valorEsperado: unknown,
    valoresPermitidos: string[] = [],
  ) =>
    ReglaValidacion.crear(
      tipoDato,
      obligatorio,
      null,
      null,
      null,
      valoresPermitidos,
      solicitud.mensajeError,
      operador,
      valorEsperado,
    );

  switch (tipo) {
    case Tipo.OPCION_UNICA: {
      operadorFijo(solicitud.operador, Op.IGUALDAD);
      const opciones = opcionesDelNodo(entrada);
      const valor = esperado.valor;
      if (typeof valor !== 'string' || !opciones.includes(valor))
        invalida('El valor esperado debe ser una de las opciones del nodo.');
      return regla(Dato.TEXTO, Op.IGUALDAD, { valor });
    }

    case Tipo.MULTISELECCION: {
      operadorFijo(solicitud.operador, Op.IGUALDAD);
      const opciones = opcionesDelNodo(entrada);
      const valor = esperado.valor;
      if (
        !Array.isArray(valor) ||
        !valor.every((v) => typeof v === 'string' && opciones.includes(v)) ||
        new Set(valor).size !== valor.length
      )
        invalida(
          'El valor esperado debe estar formado por opciones del nodo, sin repetir.',
        );
      const minimo = numero(entrada.min_selecciones) ?? 1;
      const maximo = numero(entrada.max_selecciones) ?? opciones.length;
      const cantidad = (valor as string[]).length;
      if (cantidad < minimo || cantidad > maximo)
        invalida(
          `Debes elegir entre ${minimo} y ${maximo} opciones, como se definió en el nodo.`,
        );
      return regla(Dato.SELECCION, Op.IGUALDAD, { valor }, opciones);
    }

    case Tipo.BOOLEANO: {
      operadorFijo(solicitud.operador, Op.IGUALDAD);
      if (typeof esperado.valor !== 'boolean')
        invalida('El valor esperado debe ser Sí o No.');
      return regla(Dato.SELECCION, Op.IGUALDAD, { valor: esperado.valor }, [
        'true',
        'false',
      ]);
    }

    case Tipo.ESCALA: {
      operadorFijo(solicitud.operador, Op.RANGO);
      const [min, max] = rangoDelNodo(entrada);
      return regla(Dato.NUMERICO, Op.RANGO, rangoEsperado(esperado, min, max));
    }

    case Tipo.NUMERICO: {
      const [min, max] = rangoDelNodo(entrada);
      if (solicitud.operador === Op.RANGO)
        return regla(
          Dato.NUMERICO,
          Op.RANGO,
          rangoEsperado(esperado, min, max),
        );
      if (solicitud.operador !== Op.IGUALDAD)
        return invalida('Elige si la transición usa igualdad o rango.');
      const valor = esperado.valor;
      const paso = numero(entrada.paso) ?? 1;
      if (
        typeof valor !== 'number' ||
        !Number.isFinite(valor) ||
        valor < min ||
        valor > max ||
        Math.abs((valor - min) / paso - Math.round((valor - min) / paso)) > 1e-8
      )
        invalida(
          'El valor esperado debe ser uno de los valores definidos en el nodo.',
        );
      return regla(Dato.NUMERICO, Op.IGUALDAD, { valor });
    }

    default:
      return invalida('Tipo de respuesta no soportado para transiciones.');
  }
}

export const MENSAJE_POR_DEFECTO =
  'Tu respuesta no coincide con ninguna opción esperada. Inténtalo de nuevo.';

/**
 * RF-25: regla de la transición "cualquier otra respuesta" (operador SIEMPRE).
 * Siempre coincide; el tipo de dato se deriva del nodo origen para que la
 * validación del dato siga siendo la misma que en sus otras transiciones.
 */
export function construirReglaPorDefecto(
  contenidoNodo: Record<string, unknown>,
  mensajeError?: string,
): ReglaValidacion {
  const tipo = resolverTipoEntrada(contenidoNodo);
  if (tipo === Tipo.CONTINUAR)
    invalida(
      'Un nodo sin respuesta esperada avanza solo: no lleva transición para "cualquier otra respuesta".',
    );
  const entrada = contenidoNodo.entrada as Entrada;
  const [tipoDato, valoresPermitidos]: [Dato, string[]] =
    tipo === Tipo.MULTISELECCION
      ? [Dato.SELECCION, opcionesDelNodo(entrada)]
      : tipo === Tipo.BOOLEANO
        ? [Dato.SELECCION, ['true', 'false']]
        : tipo === Tipo.ESCALA || tipo === Tipo.NUMERICO
          ? [Dato.NUMERICO, []]
          : tipo === Tipo.FECHA_HORA
            ? [Dato.FECHA, []]
            : [Dato.TEXTO, []];
  return ReglaValidacion.crear(
    tipoDato,
    entrada.obligatorio !== false,
    null,
    null,
    null,
    valoresPermitidos,
    mensajeError?.trim() ? mensajeError : MENSAJE_POR_DEFECTO,
    Op.SIEMPRE,
    {},
  );
}

function objeto(valor: unknown): Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

function operadorFijo(enviado: Op | undefined, fijo: Op): void {
  if (enviado !== undefined && enviado !== fijo)
    invalida(`Esta respuesta solo admite el operador ${fijo}.`);
}

export function opcionesDelNodo(entrada: Entrada): string[] {
  const opciones = Array.isArray(entrada.opciones) ? entrada.opciones : [];
  return opciones
    .map((opcion: unknown) =>
      typeof opcion === 'string' ? opcion : objeto(opcion).valor,
    )
    .filter((valor): valor is string => typeof valor === 'string');
}

function rangoDelNodo(entrada: Entrada): [number, number] {
  const min = numero(entrada.min);
  const max = numero(entrada.max);
  if (min === null || max === null)
    return invalida(
      'Configura el mínimo y el máximo de la respuesta en el nodo antes de crear su transición.',
    );
  return [min, max];
}

function rangoEsperado(
  esperado: Record<string, unknown>,
  min: number,
  max: number,
): { min: number; max: number } {
  const desde = numero(esperado.min);
  const hasta = numero(esperado.max);
  if (desde === null || hasta === null || desde > hasta)
    invalida(
      'Indica un mínimo y un máximo esperados, con el mínimo menor o igual al máximo.',
    );
  if ((desde as number) < min || (hasta as number) > max)
    invalida(
      `El rango esperado debe estar entre ${min} y ${max}, como se definió en el nodo.`,
    );
  return { min: desde as number, max: hasta as number };
}
