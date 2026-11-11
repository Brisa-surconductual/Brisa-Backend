import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../entities/flujo/transicion-conversacional.entity';
import {
  ConflictoRespuestaConversacionalException,
  RespuestaUsuarioInvalida,
  configuracionRespuestaInvalida,
} from '../exceptions/respuesta.exceptions';
import { CapturarRespuesta } from './capturar-respuesta.policy';
import {
  ComprobarFormato,
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
      this.condiciones.comprobarConfiguracion(t);
    }
    let primerError: RespuestaUsuarioInvalida | undefined;
    let algunaValidada = false;
    for (const t of ordenadas) {
      try {
        this.validacion.comprobar(valor, t.reglaValidacion, formato);
        algunaValidada = true;
      } catch (error: unknown) {
        if (!(error instanceof RespuestaUsuarioInvalida)) throw error;
        primerError ??= error;
        continue;
      }
      if (this.condiciones.coincide(valor, t))
        return {
          tipoEntrada: entrada.tipo,
          idNodoDestino: t.idNodoDestino,
          idRegla: t.idTransicion,
          respuesta: valor,
        };
    }
    if (!algunaValidada && primerError) throw primerError;
    return configuracionRespuestaInvalida(
      'Ninguna regla de transición aplica a la respuesta.',
    );
  }
}
