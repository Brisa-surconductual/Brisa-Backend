import { Injectable } from '@nestjs/common';
import { ReglaEntradaNodoActual } from '../ports/presentacion-nodo-actual.port';
import { EntradaNodoDtoResponse } from '../dto/presentacion-nodo-actual.dto-response';

const objeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const numero = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const limite = (v: unknown) => (typeof v === 'string' ? v : numero(v));

@Injectable()
export class PrepararEntradaNodoActualService {
  preparar(
    contenido: Record<string, unknown>,
    reglas: ReglaEntradaNodoActual[],
  ): EntradaNodoDtoResponse | null {
    const entrada = contenido.entrada;
    if (entrada === undefined || entrada === null) return null;
    if (!objeto(entrada)) throw new Error('Entrada no disponible.');
    const tipo = entrada.tipo ?? entrada.tipo_entrada;
    if (
      typeof tipo !== 'string' ||
      ![
        'ESCALA',
        'NUMERICO',
        'SELECCION_UNICA',
        'SELECCION_MULTIPLE',
        'FECHA_HORA',
        'BOOLEANO',
        'TEXTO_LIBRE',
      ].includes(tipo)
    )
      throw new Error('Tipo de entrada no disponible.');
    const valores = [...new Set(reglas.flatMap((r) => r.valoresPermitidos))];
    const opciones = this.opciones(entrada.opciones, valores);
    const etiquetas = objeto(entrada.etiquetas)
      ? entrada.etiquetas
      : { min: entrada.etiqueta_min, max: entrada.etiqueta_max };
    return {
      tipo,
      obligatorio:
        reglas.length > 0
          ? reglas.every((r) => r.obligatorio)
          : entrada.obligatorio !== false,
      min: limite(entrada.min) ?? this.limiteReglas(reglas, 'valorMin'),
      max: limite(entrada.max) ?? this.limiteReglas(reglas, 'valorMax'),
      paso: numero(entrada.paso),
      opciones,
      etiquetas:
        typeof etiquetas.min === 'string' && typeof etiquetas.max === 'string'
          ? { min: etiquetas.min, max: etiquetas.max }
          : null,
      maxCaracteres: numero(entrada.maxCaracteres ?? entrada.max_caracteres),
    };
  }

  private opciones(
    valor: unknown,
    permitidos: string[],
  ): { valor: string; etiqueta: string }[] | null {
    if (valor === undefined || valor === null)
      return permitidos.length
        ? permitidos.map((v) => ({ valor: v, etiqueta: v }))
        : null;
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

  private limiteReglas(
    reglas: ReglaEntradaNodoActual[],
    campo: 'valorMin' | 'valorMax',
  ): number | null {
    if (reglas.length === 0 || reglas.some((r) => r[campo] === null))
      return null;
    const valores = reglas.map((r) => r[campo]!);
    return campo === 'valorMin' ? Math.min(...valores) : Math.max(...valores);
  }
}
