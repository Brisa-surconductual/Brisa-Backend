import { TipoEntradaRespuesta } from '../../enums/tipo-entrada-respuesta.enum';
import {
  ENTRADAS_POR_TIPO_VALOR,
  TipoValorVariable,
} from '../../enums/tipo-valor-variable.enum';
import {
  DefinicionVariableInvalidaException,
  VariableEnUsoPublicadoException,
} from '../../exceptions/taxonomia.exceptions';
import { RespuestaUsuarioInvalida } from '../../exceptions/respuesta.exceptions';

/** Código de variable: mayúsculas, dígitos y guion bajo (máx. 60). */
export const CODIGO_VARIABLE = /^[A-Z][A-Z0-9_]{1,59}$/;

const MAX_ETIQUETA = 60;

/** Regla de una variable ENTERO: rango inclusivo; `max: null` = sin tope. */
export interface RangoEtiqueta {
  readonly min: number;
  readonly max: number | null;
  readonly etiqueta: string;
}

/** ENTERO: rangos. CATEGORIA: valor → etiqueta. BOOLEANO: "true"/"false" → etiqueta. */
export type ReglasEtiqueta =
  readonly RangoEtiqueta[] | Readonly<Record<string, string>>;

/** Un valor reportado y la etiqueta que le asigna la taxonomía. */
export interface ElementoEtiquetado {
  readonly valor: number | string | boolean;
  readonly etiqueta: string | null;
}

export interface DefinicionVariableTaxonomia {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipoValor: TipoValorVariable;
  valores?: string[] | null;
  tiposEntradaPermitidos: string[];
  etiquetas: unknown;
}

/**
 * RF-30B: variable de la taxonomía definida por psicología. Su definición es
 * inmutable; solo cambia si está habilitada. Sabe qué entradas admite un nodo
 * que la capture y cómo etiquetar el valor que reporta el estudiante.
 */
export class VariableTaxonomia {
  constructor(
    readonly idVariable: string | null,
    readonly codigo: string,
    readonly nombre: string,
    readonly descripcion: string | null,
    readonly tipoValor: TipoValorVariable,
    readonly valores: readonly string[] | null,
    readonly tiposEntradaPermitidos: readonly TipoEntradaRespuesta[],
    readonly etiquetas: ReglasEtiqueta,
    readonly habilitada: boolean,
  ) {}

  /** Valida una definición nueva; toda incoherencia es un 422. */
  static crear(def: DefinicionVariableTaxonomia): VariableTaxonomia {
    const codigo = typeof def.codigo === 'string' ? def.codigo.trim() : '';
    if (!CODIGO_VARIABLE.test(codigo))
      invalida(
        'El código debe empezar por una letra mayúscula y usar solo mayúsculas, dígitos y guion bajo (2 a 60 caracteres).',
      );
    const nombre = typeof def.nombre === 'string' ? def.nombre.trim() : '';
    if (nombre === '' || nombre.length > 120)
      invalida('El nombre es obligatorio y admite hasta 120 caracteres.');
    const descripcion =
      typeof def.descripcion === 'string' && def.descripcion.trim() !== ''
        ? def.descripcion.trim()
        : null;
    if (descripcion !== null && descripcion.length > 500)
      invalida('La descripción admite hasta 500 caracteres.');
    if (!Object.values(TipoValorVariable).includes(def.tipoValor))
      invalida('El tipo de valor debe ser ENTERO, CATEGORIA o BOOLEANO.');

    const tipos = validarEntradas(def.tipoValor, def.tiposEntradaPermitidos);
    const valores = validarValores(def.tipoValor, def.valores);
    const etiquetas = validarEtiquetas(def.tipoValor, def.etiquetas, valores);

    return new VariableTaxonomia(
      null,
      codigo,
      nombre,
      descripcion,
      def.tipoValor,
      valores,
      tipos,
      etiquetas,
      true,
    );
  }

  conId(idVariable: string): VariableTaxonomia {
    return this.copiar({ idVariable });
  }

  admiteEntrada(tipo: TipoEntradaRespuesta): boolean {
    return this.tiposEntradaPermitidos.includes(tipo);
  }

  /** CATEGORIA: opciones del nodo que no pertenecen a la variable. */
  opcionesFueraDeTaxonomia(opciones: readonly string[]): string[] {
    if (this.tipoValor !== TipoValorVariable.CATEGORIA) return [];
    const valores = this.valores ?? [];
    return opciones.filter((opcion) => !valores.includes(opcion));
  }

  /**
   * Etiqueta el valor ya validado por el nodo. Un valor que no corresponde al
   * tipo de la variable es un error del dato (400), nunca se coerciona.
   */
  etiquetar(valor: unknown): ElementoEtiquetado[] {
    switch (this.tipoValor) {
      case TipoValorVariable.ENTERO: {
        if (typeof valor !== 'number' || !Number.isInteger(valor))
          throw new RespuestaUsuarioInvalida(
            'La respuesta debe ser un número entero.',
            'TIPO_DATO_INVALIDO',
          );
        const rango = (this.etiquetas as readonly RangoEtiqueta[]).find(
          (r) => valor >= r.min && (r.max === null || valor <= r.max),
        );
        return [{ valor, etiqueta: rango?.etiqueta ?? null }];
      }
      case TipoValorVariable.CATEGORIA: {
        const elegidos =
          typeof valor === 'string'
            ? [valor]
            : Array.isArray(valor) &&
                valor.every((v): v is string => typeof v === 'string')
              ? valor
              : null;
        if (elegidos === null)
          throw new RespuestaUsuarioInvalida(
            'La respuesta debe ser una o varias opciones.',
            'TIPO_DATO_INVALIDO',
          );
        if (this.opcionesFueraDeTaxonomia(elegidos).length > 0)
          throw new RespuestaUsuarioInvalida(
            'El valor seleccionado no está permitido.',
            'VALOR_NO_PERMITIDO',
          );
        const reglas = this.etiquetas as Readonly<Record<string, string>>;
        return elegidos.map((opcion) => ({
          valor: opcion,
          etiqueta: reglas[opcion] ?? opcion,
        }));
      }
      case TipoValorVariable.BOOLEANO: {
        if (typeof valor !== 'boolean')
          throw new RespuestaUsuarioInvalida(
            'La respuesta debe ser Sí o No.',
            'TIPO_DATO_INVALIDO',
          );
        const reglas = this.etiquetas as Readonly<Record<string, string>>;
        return [{ valor, etiqueta: reglas[String(valor)] ?? null }];
      }
    }
  }

  habilitar(): VariableTaxonomia {
    return this.copiar({ habilitada: true });
  }

  /** No se deshabilita una variable que capturan nodos de un flujo publicado. */
  deshabilitar(enUsoPublicado: boolean): VariableTaxonomia {
    if (enUsoPublicado) throw new VariableEnUsoPublicadoException();
    return this.copiar({ habilitada: false });
  }

  private copiar(
    cambios: Partial<Pick<VariableTaxonomia, 'idVariable' | 'habilitada'>>,
  ): VariableTaxonomia {
    return new VariableTaxonomia(
      cambios.idVariable ?? this.idVariable,
      this.codigo,
      this.nombre,
      this.descripcion,
      this.tipoValor,
      this.valores,
      this.tiposEntradaPermitidos,
      this.etiquetas,
      cambios.habilitada ?? this.habilitada,
    );
  }
}

function invalida(mensaje: string): never {
  throw new DefinicionVariableInvalidaException(mensaje);
}

function validarEntradas(
  tipoValor: TipoValorVariable,
  entradas: unknown,
): TipoEntradaRespuesta[] {
  const admitidas = ENTRADAS_POR_TIPO_VALOR[tipoValor];
  if (
    !Array.isArray(entradas) ||
    entradas.length === 0 ||
    new Set(entradas).size !== entradas.length ||
    !entradas.every((e) => admitidas.includes(e as TipoEntradaRespuesta))
  )
    invalida(
      `Los tipos de entrada permitidos para ${tipoValor} son: ${admitidas.join(', ')} (sin repetir).`,
    );
  return entradas as TipoEntradaRespuesta[];
}

function validarValores(
  tipoValor: TipoValorVariable,
  valores: unknown,
): string[] | null {
  if (tipoValor !== TipoValorVariable.CATEGORIA) {
    if (valores != null && !(Array.isArray(valores) && valores.length === 0))
      invalida('Solo las variables CATEGORIA definen valores.');
    return null;
  }
  if (
    !Array.isArray(valores) ||
    valores.length === 0 ||
    !valores.every(
      (v) => typeof v === 'string' && v.trim() !== '' && v.length <= 120,
    ) ||
    new Set(valores).size !== valores.length
  )
    invalida(
      'Una variable CATEGORIA requiere una lista de valores no vacía y sin repetir.',
    );
  return valores as string[];
}

function etiquetaValida(etiqueta: unknown): etiqueta is string {
  return (
    typeof etiqueta === 'string' &&
    etiqueta.trim() !== '' &&
    etiqueta.length <= MAX_ETIQUETA
  );
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function validarEtiquetas(
  tipoValor: TipoValorVariable,
  etiquetas: unknown,
  valores: string[] | null,
): ReglasEtiqueta {
  if (tipoValor === TipoValorVariable.ENTERO) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0)
      invalida('Una variable ENTERO define sus etiquetas como rangos.');
    const rangos = etiquetas.map((regla: unknown): RangoEtiqueta => {
      if (
        !esObjeto(regla) ||
        !Number.isInteger(regla.min) ||
        !(regla.max === null || Number.isInteger(regla.max)) ||
        !etiquetaValida(regla.etiqueta) ||
        (regla.max !== null && (regla.max as number) < (regla.min as number))
      )
        invalida(
          `Cada rango requiere min entero, max entero (≥ min) o null y una etiqueta de hasta ${MAX_ETIQUETA} caracteres.`,
        );
      return {
        min: regla.min as number,
        max: regla.max as number | null,
        etiqueta: regla.etiqueta,
      };
    });
    const ordenados = [...rangos].sort((a, b) => a.min - b.min);
    for (let i = 1; i < ordenados.length; i += 1) {
      const anterior = ordenados[i - 1];
      if (anterior.max === null || anterior.max >= ordenados[i].min)
        invalida('Los rangos de etiquetas no pueden solaparse.');
    }
    return ordenados;
  }

  if (!esObjeto(etiquetas))
    invalida(
      `Una variable ${tipoValor} define sus etiquetas como un objeto valor → etiqueta.`,
    );
  const claves = Object.keys(etiquetas);
  if (!claves.every((clave) => etiquetaValida(etiquetas[clave])))
    invalida(
      `Cada etiqueta debe ser un texto de hasta ${MAX_ETIQUETA} caracteres.`,
    );
  if (tipoValor === TipoValorVariable.BOOLEANO) {
    if (
      claves.length !== 2 ||
      !claves.includes('true') ||
      !claves.includes('false')
    )
      invalida('Una variable BOOLEANO define las etiquetas "true" y "false".');
  } else if (!claves.every((clave) => (valores ?? []).includes(clave))) {
    invalida('Las etiquetas solo pueden referirse a valores de la variable.');
  }
  return { ...(etiquetas as Record<string, string>) };
}
