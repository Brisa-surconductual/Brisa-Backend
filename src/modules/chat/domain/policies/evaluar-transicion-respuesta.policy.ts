import { ReglaValidacion } from '../entities/reglas-validacion/reglas-validacion.entity';
import { OperadorCondicion as Op } from '../enums/operador-condicional.enum';
import { ValorRespuesta } from './configuracion-entrada-respuesta';

/** RF-29: decide si una respuesta ya capturada cumple el valor esperado de una regla. */
export class EvaluarTransicionRespuesta {
  coincide(valor: ValorRespuesta, regla: ReglaValidacion): boolean {
    const esperado = regla.valorEsperado as {
      valor?: unknown;
      min?: number;
      max?: number;
    };
    switch (regla.operadorCondicion) {
      case Op.IGUALDAD:
        // Selección múltiple: el estudiante no envía las opciones en un orden fijo.
        return Array.isArray(valor) && Array.isArray(esperado.valor)
          ? valor.length === esperado.valor.length &&
              valor.every((v) => (esperado.valor as unknown[]).includes(v))
          : valor === esperado.valor;
      case Op.SIEMPRE:
        // RF-25: "cualquier otra respuesta"; queda última en el orden.
        return true;
      case Op.RANGO:
        return (
          typeof valor === 'number' &&
          valor >= (esperado.min as number) &&
          valor <= (esperado.max as number)
        );
    }
  }
}
