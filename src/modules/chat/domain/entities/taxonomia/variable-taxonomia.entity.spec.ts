import { variablesSeed } from '../../../application/support/testing/taxonomia-variables.fixture';
import { TipoEntradaRespuesta as Entrada } from '../../enums/tipo-entrada-respuesta.enum';
import { TipoValorVariable as Tipo } from '../../enums/tipo-valor-variable.enum';
import { RespuestaUsuarioInvalida } from '../../exceptions/respuesta.exceptions';
import {
  DefinicionVariableInvalidaException,
  VariableEnUsoPublicadoException,
} from '../../exceptions/taxonomia.exceptions';
import {
  DefinicionVariableTaxonomia,
  VariableTaxonomia,
} from './variable-taxonomia.entity';

describe('RF-30B VariableTaxonomia', () => {
  const entero = (
    cambios: Partial<DefinicionVariableTaxonomia> = {},
  ): DefinicionVariableTaxonomia => ({
    codigo: 'HORAS_SUENO',
    nombre: 'Horas de sueño',
    tipoValor: Tipo.ENTERO,
    tiposEntradaPermitidos: [Entrada.NUMERICO],
    etiquetas: [
      { min: 0, max: 5, etiqueta: 'SUENO_INSUFICIENTE' },
      { min: 6, max: null, etiqueta: 'SUENO_ADECUADO' },
    ],
    ...cambios,
  });

  describe('crear', () => {
    it('crea una variable ENTERO habilitada, sin id y con los rangos ordenados', () => {
      const variable = VariableTaxonomia.crear(
        entero({
          etiquetas: [
            { min: 6, max: null, etiqueta: 'ALTO' },
            { min: 0, max: 5, etiqueta: 'BAJO' },
          ],
        }),
      );
      expect(variable.idVariable).toBeNull();
      expect(variable.habilitada).toBe(true);
      expect(variable.valores).toBeNull();
      expect(variable.etiquetas).toEqual([
        { min: 0, max: 5, etiqueta: 'BAJO' },
        { min: 6, max: null, etiqueta: 'ALTO' },
      ]);
    });

    it('crea una variable CATEGORIA y una BOOLEANO', () => {
      expect(
        VariableTaxonomia.crear({
          codigo: 'LUGAR',
          nombre: 'Lugar',
          tipoValor: Tipo.CATEGORIA,
          valores: ['CASA', 'U'],
          tiposEntradaPermitidos: [Entrada.OPCION_UNICA],
          etiquetas: { U: 'UNIVERSIDAD' },
        }).valores,
      ).toEqual(['CASA', 'U']);
      expect(
        VariableTaxonomia.crear({
          codigo: 'ACOMPANADO',
          nombre: 'Acompañado',
          tipoValor: Tipo.BOOLEANO,
          tiposEntradaPermitidos: [Entrada.BOOLEANO],
          etiquetas: { true: 'SI', false: 'NO' },
        }).tipoValor,
      ).toBe(Tipo.BOOLEANO);
    });

    it.each<[string, Partial<DefinicionVariableTaxonomia>]>([
      ['código en minúsculas', { codigo: 'horas' }],
      ['nombre vacío', { nombre: '   ' }],
      [
        'entrada no admitida por ENTERO',
        { tiposEntradaPermitidos: [Entrada.BOOLEANO] },
      ],
      [
        'entradas repetidas',
        { tiposEntradaPermitidos: [Entrada.NUMERICO, Entrada.NUMERICO] },
      ],
      ['sin entradas', { tiposEntradaPermitidos: [] }],
      ['valores en ENTERO', { valores: ['A'] }],
      ['etiquetas como objeto', { etiquetas: { a: 'b' } }],
      [
        'rangos solapados',
        {
          etiquetas: [
            { min: 0, max: 5, etiqueta: 'A' },
            { min: 5, max: 9, etiqueta: 'B' },
          ],
        },
      ],
      [
        'rango sin tope seguido de otro',
        {
          etiquetas: [
            { min: 0, max: null, etiqueta: 'A' },
            { min: 5, max: 9, etiqueta: 'B' },
          ],
        },
      ],
      ['max menor que min', { etiquetas: [{ min: 5, max: 1, etiqueta: 'A' }] }],
      ['min decimal', { etiquetas: [{ min: 0.5, max: 1, etiqueta: 'A' }] }],
    ])('rechaza %s (422)', (_caso, cambios) => {
      expect(() => VariableTaxonomia.crear(entero(cambios))).toThrow(
        DefinicionVariableInvalidaException,
      );
    });

    it('rechaza una CATEGORIA sin valores o con etiquetas ajenas', () => {
      const base: DefinicionVariableTaxonomia = {
        codigo: 'LUGAR',
        nombre: 'Lugar',
        tipoValor: Tipo.CATEGORIA,
        valores: ['CASA'],
        tiposEntradaPermitidos: [Entrada.MULTISELECCION],
        etiquetas: {},
      };
      expect(() => VariableTaxonomia.crear({ ...base, valores: [] })).toThrow(
        DefinicionVariableInvalidaException,
      );
      expect(() =>
        VariableTaxonomia.crear({ ...base, etiquetas: { OTRO: 'X' } }),
      ).toThrow(DefinicionVariableInvalidaException);
    });

    it('rechaza un BOOLEANO sin las dos etiquetas', () => {
      expect(() =>
        VariableTaxonomia.crear({
          codigo: 'ACOMPANADO',
          nombre: 'Acompañado',
          tipoValor: Tipo.BOOLEANO,
          tiposEntradaPermitidos: [Entrada.BOOLEANO],
          etiquetas: { true: 'SI' },
        }),
      ).toThrow(DefinicionVariableInvalidaException);
    });
  });

  describe('etiquetar', () => {
    const { nivelCraving, contextoEmocional, situacionRiesgo } = variablesSeed;

    it.each([
      [0, 'CRAVING_BAJO'],
      [4, 'CRAVING_MODERADO'],
      [10, 'CRAVING_ALTO'],
      [11, null],
    ])('ENTERO %p → %p', (valor, etiqueta) => {
      expect(nivelCraving.etiquetar(valor)).toEqual([{ valor, etiqueta }]);
    });

    it('ENTERO rechaza decimales y texto sin coerción', () => {
      expect(() => nivelCraving.etiquetar(4.5)).toThrow(
        RespuestaUsuarioInvalida,
      );
      expect(() => nivelCraving.etiquetar('4')).toThrow(
        RespuestaUsuarioInvalida,
      );
    });

    it('CATEGORIA: un elemento por opción; sin regla, la etiqueta es el valor', () => {
      expect(contextoEmocional.etiquetar(['ANSIEDAD', 'CALMA'])).toEqual([
        { valor: 'ANSIEDAD', etiqueta: 'ANSIEDAD' },
        { valor: 'CALMA', etiqueta: 'CALMA' },
      ]);
      expect(contextoEmocional.etiquetar('ESTRES')).toEqual([
        { valor: 'ESTRES', etiqueta: 'ESTRES' },
      ]);
    });

    it('CATEGORIA rechaza valores ajenos con VALOR_NO_PERMITIDO', () => {
      expect(() => contextoEmocional.etiquetar('FELICIDAD')).toThrow(
        expect.objectContaining({ codigo: 'VALOR_NO_PERMITIDO' }),
      );
    });

    it('BOOLEANO etiqueta Sí/No y rechaza otros tipos', () => {
      expect(situacionRiesgo.etiquetar(true)).toEqual([
        { valor: true, etiqueta: 'RIESGO_PRESENTE' },
      ]);
      expect(situacionRiesgo.etiquetar(false)).toEqual([
        { valor: false, etiqueta: 'RIESGO_AUSENTE' },
      ]);
      expect(() => situacionRiesgo.etiquetar('true')).toThrow(
        expect.objectContaining({ codigo: 'TIPO_DATO_INVALIDO' }),
      );
    });
  });

  describe('entradas, opciones y estado', () => {
    it('la variable filtra las entradas del nodo', () => {
      expect(variablesSeed.nivelCraving.admiteEntrada(Entrada.ESCALA)).toBe(
        true,
      );
      expect(
        variablesSeed.nivelCraving.admiteEntrada(Entrada.OPCION_UNICA),
      ).toBe(false);
      expect(
        variablesSeed.situacionRiesgo.admiteEntrada(Entrada.BOOLEANO),
      ).toBe(true);
    });

    it('detecta opciones del nodo fuera de la taxonomía', () => {
      expect(
        variablesSeed.contextoEmocional.opcionesFueraDeTaxonomia([
          'ANSIEDAD',
          'OTRA',
        ]),
      ).toEqual(['OTRA']);
      expect(
        variablesSeed.nivelCraving.opcionesFueraDeTaxonomia(['X']),
      ).toEqual([]);
    });

    it('no se deshabilita si un flujo publicado la usa; se puede rehabilitar', () => {
      const variable = variablesSeed.nivelCraving;
      expect(() => variable.deshabilitar(true)).toThrow(
        VariableEnUsoPublicadoException,
      );
      const deshabilitada = variable.deshabilitar(false);
      expect(deshabilitada.habilitada).toBe(false);
      expect(deshabilitada.idVariable).toBe(variable.idVariable);
      expect(deshabilitada.habilitar().habilitada).toBe(true);
    });
  });
});
