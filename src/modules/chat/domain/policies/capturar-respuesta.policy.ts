import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import {
  TipoEntradaRespuesta as Tipo,
  tipoEntradaConfigurado,
} from '../enums/tipo-entrada-respuesta.enum';
import {
  configuracionRespuestaInvalida as configuracion,
  RespuestaUsuarioInvalida,
} from '../exceptions/respuesta.exceptions';
import {
  esObjetoRespuesta,
  respuestaVacia,
  ValorRespuesta,
} from './configuracion-entrada-respuesta';
import { fechaRespuestaValida } from './fecha-respuesta.policy';
import { RestriccionesEntradaRespuesta } from './restricciones-entrada-respuesta.policy';

/** RF-27: captura sin coerción. No consulta reglas de navegación. */
export class CapturarRespuesta {
  private readonly restricciones = new RestriccionesEntradaRespuesta();

  entrada(nodo: NodoConversacional): Record<string, unknown> & { tipo: Tipo } {
    const entrada: unknown = nodo.contenido?.entrada;
    if (entrada == null) {
      if (nodo.nombreTipoNodo === 'PREGUNTA')
        configuracion('La pregunta no define entrada.');
      return { tipo: Tipo.CONTINUAR };
    }
    if (!esObjetoRespuesta(entrada))
      return configuracion('Entrada no configurada.');
    const tipo = tipoEntradaConfigurado(entrada.tipo ?? entrada.tipo_entrada);
    if (tipo === null) return configuracion('Tipo de entrada no configurado.');
    if (
      entrada.formato != null &&
      (typeof entrada.formato !== 'string' ||
        !['FECHA', 'HORA', 'FECHA_HORA'].includes(entrada.formato))
    )
      configuracion('Formato de fecha/hora desconocido.');
    return { ...entrada, tipo };
  }

  capturar(
    valor: unknown,
    entrada: Record<string, unknown> & { tipo: Tipo },
    declarado: string,
  ): ValorRespuesta {
    const tipoEsperado: string = entrada.tipo;
    if (declarado !== tipoEsperado)
      throw new RespuestaUsuarioInvalida(
        'El tipo de entrada no está permitido en este nodo.',
        'TIPO_ENTRADA_NO_PERMITIDO',
        'tipoEntrada',
      );
    if (valor === undefined)
      throw new RespuestaUsuarioInvalida(
        'Este campo es obligatorio.',
        'RESPUESTA_OBLIGATORIA',
      );
    if (entrada.tipo === Tipo.CONTINUAR) {
      if (valor !== null) this.tipoInvalido();
      return null;
    }
    if (valor === null) return null;
    const texto = typeof valor === 'string';
    const numero = typeof valor === 'number' && Number.isFinite(valor);
    const multiple =
      Array.isArray(valor) &&
      valor.length <= 100 &&
      valor.every((v: unknown) => typeof v === 'string' && v.length <= 8192) &&
      new Set(valor).size === valor.length;
    const compatible =
      ((entrada.tipo === Tipo.OPCION_UNICA ||
        entrada.tipo === Tipo.TEXTO_LIBRE ||
        entrada.tipo === Tipo.FECHA_HORA) &&
        texto) ||
      ((entrada.tipo === Tipo.ESCALA || entrada.tipo === Tipo.NUMERICO) &&
        numero) ||
      (entrada.tipo === Tipo.MULTISELECCION && multiple) ||
      (entrada.tipo === Tipo.BOOLEANO && typeof valor === 'boolean');
    if (!compatible || (texto && valor.length > 8192)) this.tipoInvalido();
    if (
      entrada.tipo === Tipo.FECHA_HORA &&
      !respuestaVacia(valor) &&
      !fechaRespuestaValida(valor as string, entrada.formato)
    )
      throw new RespuestaUsuarioInvalida(
        'El formato de la respuesta es incorrecto.',
        'FORMATO_INCORRECTO',
      );
    if (!respuestaVacia(valor))
      this.restricciones.comprobar(valor as ValorRespuesta, entrada);
    return valor as ValorRespuesta;
  }

  private tipoInvalido(): never {
    throw new RespuestaUsuarioInvalida(
      'El formato de la respuesta no es válido.',
      'TIPO_DATO_INVALIDO',
    );
  }
}
