import {
  configuracionRespuestaInvalida as configuracion,
  RespuestaUsuarioInvalida,
} from '../exceptions/respuesta.exceptions';
import {
  esObjetoRespuesta,
  ValorRespuesta,
} from './configuracion-entrada-respuesta';
import { fechaRespuestaValida } from './fecha-respuesta.policy';

export class RestriccionesEntradaRespuesta {
  comprobar(valor: ValorRespuesta, entrada: Record<string, unknown>): void {
    if (typeof valor === 'number') {
      this.rango(valor, entrada.min, entrada.max);
      if (entrada.paso != null) {
        const paso = entrada.paso;
        if (typeof paso !== 'number' || !Number.isFinite(paso) || paso <= 0)
          configuracion('Paso de escala inválido.');
        const base = typeof entrada.min === 'number' ? entrada.min : 0;
        const pasos = (valor - base) / paso;
        if (Math.abs(pasos - Math.round(pasos)) > 1e-8) this.formato();
      }
      if (entrada.decimales != null) {
        if (
          !Number.isInteger(entrada.decimales) ||
          Number(entrada.decimales) < 0 ||
          Number(entrada.decimales) > 10
        )
          configuracion('Precisión numérica inválida.');
        const factor = 10 ** Number(entrada.decimales);
        if (Math.abs(valor * factor - Math.round(valor * factor)) > 1e-8)
          this.formato();
      }
    }
    if (Array.isArray(valor))
      this.rango(
        valor.length,
        entrada.min_selecciones,
        entrada.max_selecciones,
      );
    if (entrada.tipo === 'FECHA_HORA' && typeof valor === 'string') {
      const medida = (v: string) =>
        entrada.formato === 'HORA'
          ? v
              .split(':')
              .reduce(
                (total, parte, i) => total + Number(parte) * 60 ** (2 - i),
                0,
              )
          : Date.parse(v);
      const limite = (v: unknown): number | undefined => {
        if (v == null) return undefined;
        if (typeof v !== 'string' || !fechaRespuestaValida(v, entrada.formato))
          return configuracion('Límite de fecha/hora inválido.');
        return medida(v);
      };
      this.rango(medida(valor), limite(entrada.min), limite(entrada.max));
    }
    if (entrada.tipo === 'TEXTO_LIBRE' && typeof valor === 'string') {
      this.rango(
        valor.trim() === '' ? 0 : valor.trim().split(/\s+/u).length,
        entrada.min_palabras,
        entrada.max_palabras,
      );
      this.rango(
        valor.length,
        undefined,
        entrada.maxCaracteres ?? entrada.max_caracteres,
      );
    }
    if (entrada.opciones != null) {
      if (!Array.isArray(entrada.opciones))
        configuracion('Opciones inválidas.');
      const opciones = (entrada.opciones as unknown[]).map((opcion) => {
        if (typeof opcion === 'string') return opcion;
        if (esObjetoRespuesta(opcion) && typeof opcion.valor === 'string')
          return opcion.valor;
        return configuracion('Opción inválida.');
      });
      if (
        (Array.isArray(valor) ? valor : [valor]).some(
          (v) => typeof v !== 'string' || !opciones.includes(v),
        )
      )
        throw new RespuestaUsuarioInvalida(
          'La respuesta seleccionada no es válida para esta pregunta.',
          'VALOR_NO_PERMITIDO',
        );
    }
  }

  private rango(medida: number, min: unknown, max: unknown): void {
    for (const limite of [min, max]) {
      if (
        limite != null &&
        (typeof limite !== 'number' || !Number.isFinite(limite))
      )
        configuracion('Límites de entrada inválidos.');
    }
    if (typeof min === 'number' && typeof max === 'number' && min > max)
      configuracion('Límites de entrada invertidos.');
    if (
      (typeof min === 'number' && medida < min) ||
      (typeof max === 'number' && medida > max)
    )
      throw new RespuestaUsuarioInvalida(
        'El valor ingresado está fuera del rango permitido.',
        'FUERA_DE_RANGO',
      );
  }

  private formato(): never {
    throw new RespuestaUsuarioInvalida(
      'El formato de la respuesta es incorrecto.',
      'FORMATO_INCORRECTO',
    );
  }
}
