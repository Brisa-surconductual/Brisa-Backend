import { TransicionConversacional } from '../entities/flujo/transicion-conversacional.entity';
import { OperadorCondicion as Operador } from '../enums/operador-condicional.enum';
import { configuracionRespuestaInvalida as configuracion } from '../exceptions/respuesta.exceptions';
import {
  esObjetoRespuesta as objeto,
  ValorRespuesta,
} from './configuracion-entrada-respuesta';

/** RF-29: condiciones declaradas por el árbol; nunca valida o transforma el dato. */
export class EvaluarTransicionRespuesta {
  comprobarConfiguracion(t: TransicionConversacional): void {
    const c = t.valorCondicion;
    if (objeto(c) && c.campo !== undefined && c.campo !== 'es_valida')
      configuracion('Campo de condición desconocido.');
    if (
      objeto(c) &&
      c.campo === 'es_valida' &&
      (t.operadorCondicion !== Operador.IGUALDAD ||
        typeof c.valor !== 'boolean')
    )
      configuracion('La condición de validez requiere igualdad booleana.');
    switch (t.operadorCondicion) {
      case Operador.IGUALDAD:
        if (objeto(c) ? !Object.hasOwn(c, 'valor') : c === undefined)
          configuracion('IGUALDAD requiere valor.');
        break;
      case Operador.RANGO:
        if (
          !objeto(c) ||
          (c.min === undefined && c.max === undefined) ||
          (c.min !== undefined &&
            (typeof c.min !== 'number' || !Number.isFinite(c.min))) ||
          (c.max !== undefined &&
            (typeof c.max !== 'number' || !Number.isFinite(c.max))) ||
          (typeof c.min === 'number' &&
            typeof c.max === 'number' &&
            c.min > c.max)
        )
          configuracion('RANGO requiere límites coherentes.');
        break;
      case Operador.CATEGORIA:
        if (
          !objeto(c) ||
          !Array.isArray(c.valores) ||
          c.valores.length === 0 ||
          !c.valores.every((v: unknown) => typeof v === 'string')
        )
          configuracion('CATEGORIA requiere valores.');
        break;
      default:
        configuracion('Operador desconocido.');
    }
  }

  coincide(valor: ValorRespuesta, t: TransicionConversacional): boolean {
    const c = t.valorCondicion;
    switch (t.operadorCondicion) {
      case Operador.IGUALDAD: {
        const esperado: unknown = objeto(c) ? c.valor : c;
        // Solo llega aquí una respuesta que ya pasó su regla de validación.
        if (objeto(c) && c.campo === 'es_valida') return esperado === true;
        return Array.isArray(valor) && Array.isArray(esperado)
          ? valor.length === esperado.length &&
              valor.every((v, i) => v === esperado[i])
          : valor === esperado;
      }
      case Operador.RANGO: {
        const rango = c as { min?: number; max?: number };
        return (
          typeof valor === 'number' &&
          (rango.min === undefined || valor >= rango.min) &&
          (rango.max === undefined || valor <= rango.max)
        );
      }
      case Operador.CATEGORIA:
        return (Array.isArray(valor) ? valor : [valor]).some((v) =>
          (c as { valores: string[] }).valores.includes(String(v)),
        );
    }
  }
}
