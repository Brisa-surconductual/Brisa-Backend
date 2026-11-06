import { ReglaValidacion } from '../entities/reglas-validacion/reglas-validacion.entity';
import { TipoDatoValidacion as Tipo } from '../enums/tipo-dato-validacion-enum';
import {
  configuracionRespuestaInvalida,
  RespuestaUsuarioInvalida,
} from '../exceptions/respuesta.exceptions';
import {
  ComprobarFormato,
  respuestaVacia,
  ValorRespuesta,
} from './configuracion-entrada-respuesta';
import { fechaRespuestaValida } from './fecha-respuesta.policy';

/** RF-28: valida el dato; no elige ni ejecuta una transición. */
export class ValidarRespuesta {
  comprobar(
    valor: ValorRespuesta,
    regla: ReglaValidacion,
    formato: ComprobarFormato,
  ): void {
    const rechazar = (codigo: string, mensaje = regla.mensajeError): never => {
      throw new RespuestaUsuarioInvalida(mensaje, codigo);
    };
    if (respuestaVacia(valor)) {
      if (regla.obligatorio) rechazar('RESPUESTA_OBLIGATORIA');
      return;
    }
    switch (regla.tipoDato) {
      case Tipo.NUMERICO:
        if (typeof valor !== 'number') rechazar('TIPO_DATO_INVALIDO');
        if (
          (regla.valorMin !== null && (valor as number) < regla.valorMin) ||
          (regla.valorMax !== null && (valor as number) > regla.valorMax)
        )
          rechazar(
            'FUERA_DE_RANGO',
            'El valor ingresado está fuera del rango permitido.',
          );
        break;
      case Tipo.TEXTO:
        if (typeof valor !== 'string') rechazar('TIPO_DATO_INVALIDO');
        if (
          regla.formatoRegex !== null &&
          !formato(regla.formatoRegex, valor as string)
        )
          rechazar('FORMATO_INCORRECTO');
        break;
      case Tipo.FECHA:
        if (typeof valor !== 'string') rechazar('TIPO_DATO_INVALIDO');
        if (
          !fechaRespuestaValida(valor as string, undefined) &&
          !fechaRespuestaValida(valor as string, 'HORA')
        )
          rechazar('FORMATO_INCORRECTO');
        break;
      case Tipo.SELECCION:
        if (
          (Array.isArray(valor) ? valor : [valor]).some(
            (v) => !regla.valoresPermitidos.includes(String(v)),
          )
        )
          rechazar('VALOR_NO_PERMITIDO');
        break;
      default:
        configuracionRespuestaInvalida('Tipo de validación desconocido.');
    }
  }
}
