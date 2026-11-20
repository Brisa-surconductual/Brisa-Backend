import { Injectable } from '@nestjs/common';
import { tipoEntradaConfigurado } from '../../domain/enums/tipo-entrada-respuesta.enum';
import { EntradaNodoDtoResponse } from '../dto/presentacion-nodo-actual.dto-response';

const objeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const numero = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const limite = (v: unknown) => (typeof v === 'string' ? v : numero(v));

/**
 * RF-25: la entrada del nodo es la única fuente de lo que ve el estudiante.
 * Las reglas son de cada transición (valor esperado), no de la pregunta.
 */
@Injectable()
export class PrepararEntradaNodoActualService {
  preparar(contenido: Record<string, unknown>): EntradaNodoDtoResponse | null {
    const entrada = contenido.entrada;
    if (entrada === undefined || entrada === null) return null;
    if (!objeto(entrada)) throw new Error('Entrada no disponible.');
    // RF-27 v1.1: el estudiante ve siempre el literal canónico; los alias
    // históricos (SELECCION_*) solo existen en contenido ya guardado.
    const tipo = tipoEntradaConfigurado(entrada.tipo ?? entrada.tipo_entrada);
    if (tipo === null) throw new Error('Tipo de entrada no disponible.');
    const etiquetas = objeto(entrada.etiquetas)
      ? entrada.etiquetas
      : { min: entrada.etiqueta_min, max: entrada.etiqueta_max };
    return {
      tipo,
      obligatorio: entrada.obligatorio !== false,
      min: limite(entrada.min),
      max: limite(entrada.max),
      paso: numero(entrada.paso),
      opciones: this.opciones(entrada.opciones),
      etiquetas:
        typeof etiquetas.min === 'string' && typeof etiquetas.max === 'string'
          ? { min: etiquetas.min, max: etiquetas.max }
          : null,
      maxCaracteres: numero(entrada.maxCaracteres ?? entrada.max_caracteres),
    };
  }

  private opciones(
    valor: unknown,
  ): { valor: string; etiqueta: string }[] | null {
    if (valor === undefined || valor === null) return null;
    if (!Array.isArray(valor)) throw new Error('Opciones no disponibles.');
    return valor.map((opcion: unknown) => {
      if (typeof opcion === 'string')
        return { valor: opcion, etiqueta: opcion };
      if (
        !objeto(opcion) ||
        typeof opcion.valor !== 'string' ||
        typeof opcion.etiqueta !== 'string'
      )
        throw new Error('Opción no disponible.');
      return { valor: opcion.valor, etiqueta: opcion.etiqueta };
    });
  }
}
