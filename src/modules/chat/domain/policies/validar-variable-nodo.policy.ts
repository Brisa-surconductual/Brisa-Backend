import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { VariableTaxonomia } from '../entities/taxonomia/variable-taxonomia.entity';
import { TipoEntradaRespuesta } from '../enums/tipo-entrada-respuesta.enum';
import { ConfiguracionRespuestaInvalida } from '../exceptions/respuesta.exceptions';
import {
  NodoFinalConVariableException,
  OpcionesFueraDeTaxonomiaException,
  TipoEntradaIncompatibleException,
  VariableDeshabilitadaException,
  VariableNoValidaException,
} from '../exceptions/taxonomia.exceptions';
import { CapturarRespuesta } from './capturar-respuesta.policy';
import { opcionesDelNodo } from './regla-por-tipo-entrada';

/**
 * RF-30B: un nodo solo puede capturar una variable habilitada cuyo tipo de
 * valor admita su tipo de respuesta (la variable filtra las entradas).
 */
export class ValidarVariableNodoPolicy {
  private readonly captura = new CapturarRespuesta();

  validar(
    nodo: NodoConversacional,
    codigo: string,
    variable: VariableTaxonomia | null,
  ): void {
    const detalles = { id_nodo: nodo.idNodo, codigo };
    if (variable === null) throw new VariableNoValidaException(detalles);
    if (!variable.habilitada)
      throw new VariableDeshabilitadaException(detalles);
    if (nodo.esNodoFinal) throw new NodoFinalConVariableException(detalles);

    const entrada = this.entrada(nodo);
    if (entrada === null || !variable.admiteEntrada(entrada.tipo))
      throw new TipoEntradaIncompatibleException({
        ...detalles,
        tipos_entrada_permitidos: variable.tiposEntradaPermitidos,
      });

    const fuera = variable.opcionesFueraDeTaxonomia(opcionesDelNodo(entrada));
    if (fuera.length > 0)
      throw new OpcionesFueraDeTaxonomiaException({
        ...detalles,
        opciones: fuera,
        valores: variable.valores,
      });
  }

  private entrada(
    nodo: NodoConversacional,
  ): (Record<string, unknown> & { tipo: TipoEntradaRespuesta }) | null {
    try {
      return this.captura.entrada(nodo);
    } catch (error: unknown) {
      if (error instanceof ConfiguracionRespuestaInvalida) return null;
      throw error;
    }
  }
}
