import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../entities/reglas-validacion/reglas-validacion.entity';
import { TipoEntradaRespuesta } from '../enums/tipo-entrada-respuesta.enum';
import {
  ConflictoRespuestaConversacionalException,
  RespuestaUsuarioInvalida,
  configuracionRespuestaInvalida,
} from '../exceptions/respuesta.exceptions';
import { CapturarRespuesta } from './capturar-respuesta.policy';
import {
  ComprobarFormato,
  respuestaVacia,
  ValorRespuesta,
} from './configuracion-entrada-respuesta';
import { EvaluarTransicionRespuesta } from './evaluar-transicion-respuesta.policy';
import { ValidarRespuesta } from './validar-respuesta.policy';

export {
  ConfiguracionRespuestaInvalida,
  RespuestaUsuarioInvalida,
} from '../exceptions/respuesta.exceptions';
export type {
  ValorRespuesta,
  ComprobarFormato,
} from './configuracion-entrada-respuesta';
export interface DecisionRespuesta {
  tipoEntrada: string;
  idNodoDestino: string;
  idRegla: string;
  respuesta: ValorRespuesta;
}

const MENSAJE_SIN_COINCIDENCIA =
  'Tu respuesta no coincide con ninguna opción esperada. Inténtalo de nuevo.';

/** Coordina políticas puras RF-27/28/29; no accede a Prisma ni cambia la sesión. */
export class MotorRespuestaConversacional {
  private readonly captura = new CapturarRespuesta();
  private readonly validacion = new ValidarRespuesta();
  private readonly condiciones = new EvaluarTransicionRespuesta();

  resolver(
    nodo: NodoConversacional,
    transiciones: TransicionConversacional[],
    respuesta: unknown,
    formato: ComprobarFormato,
    tipoDeclarado: string,
    validarAdicional?: (valor: ValorRespuesta) => void,
  ): DecisionRespuesta {
    if (transiciones.length === 0)
      throw new ConflictoRespuestaConversacionalException(
        'Este nodo no requiere respuesta del usuario.',
        'NODO_TERMINAL',
      );
    // 1. Formato y límites básicos que define la entrada del nodo origen.
    const entrada = this.captura.entrada(nodo);
    const valor = this.captura.capturar(respuesta, entrada, tipoDeclarado);
    validarAdicional?.(valor);
    const ordenadas = [...transiciones].sort(
      (a, b) => a.ordenEvaluacion - b.ordenEvaluacion,
    );
    const ordenes = new Set<number>();
    for (const t of ordenadas) {
      if (
        t.idFlujo !== nodo.idFlujo ||
        t.idNodoOrigen !== nodo.idNodo ||
        ordenes.has(t.ordenEvaluacion)
      )
        configuracionRespuestaInvalida(
          'Transiciones ajenas al nodo u órdenes repetidos.',
        );
      ordenes.add(t.ordenEvaluacion);
    }
    const decision = (t: TransicionConversacional): DecisionRespuesta => ({
      tipoEntrada: entrada.tipo,
      idNodoDestino: t.idNodoDestino,
      idRegla: t.idTransicion,
      respuesta: valor,
    });

    // Un nodo sin respuesta (CONTINUAR) avanza por su primera transición.
    if (entrada.tipo === TipoEntradaRespuesta.CONTINUAR)
      return decision(ordenadas[0]);

    // 2. La primera transición (por orden) cuya regla se cumple.
    const reglas = ordenadas.map((t) => {
      if (t.reglaValidacion === null)
        configuracionRespuestaInvalida(
          'Una transición de un nodo con respuesta no tiene regla.',
        );
      return t.reglaValidacion;
    });
    // `obligatorio` sale de la entrada del nodo: es igual en todas sus reglas.
    if (respuestaVacia(valor) && reglas[0].obligatorio)
      throw new RespuestaUsuarioInvalida(
        reglas[0].mensajeError,
        'RESPUESTA_OBLIGATORIA',
      );
    const elegida = ordenadas.findIndex((_, i) =>
      this.cumple(valor, reglas[i], formato),
    );
    if (elegida >= 0) return decision(ordenadas[elegida]);

    // 3. Ninguna: no se avanza; el estudiante ve el mensaje de la primera.
    throw new RespuestaUsuarioInvalida(
      reglas[0].mensajeError.trim() || MENSAJE_SIN_COINCIDENCIA,
      'SIN_COINCIDENCIA',
    );
  }

  private cumple(
    valor: ValorRespuesta,
    regla: ReglaValidacion,
    formato: ComprobarFormato,
  ): boolean {
    try {
      this.validacion.comprobar(valor, regla, formato);
    } catch (error: unknown) {
      if (error instanceof RespuestaUsuarioInvalida) return false;
      throw error;
    }
    return this.condiciones.coincide(valor, regla);
  }
}
