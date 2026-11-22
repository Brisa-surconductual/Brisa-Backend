import { variablesSeed } from '../../application/support/testing/taxonomia-variables.fixture';
import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { EstadoEtiquetado } from '../enums/tipo-valor-variable.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { EtiquetadoVariablePolicy } from './etiquetado-variable.policy';
import { ValidarVariableNodoPolicy } from './validar-variable-nodo.policy';
import { extraerVariableNodo, validarVariableNodo } from './variable-nodo';

const nodo = (
  contenido: Record<string, unknown>,
  { esNodoFinal = false, tipo = 'PREGUNTA' } = {},
) =>
  new NodoConversacional(
    'nodo-1',
    'flujo-1',
    'tipo',
    tipo,
    contenido,
    false,
    1,
    null,
    'actor',
    new Date(),
    new Date(),
    esNodoFinal,
  );

describe('RF-30B marca contenido.variable', () => {
  it('lee el código o null si el nodo no captura variable', () => {
    expect(
      extraerVariableNodo({ variable: { codigo: 'NIVEL_CRAVING' } }),
    ).toEqual({
      codigo: 'NIVEL_CRAVING',
    });
    expect(extraerVariableNodo({ texto: 'Hola' })).toBeNull();
    expect(extraerVariableNodo({ variable: null })).toBeNull();
  });

  it.each([
    [
      'un arreglo (más de una variable)',
      [{ codigo: 'A_B' }, { codigo: 'C_D' }],
    ],
    ['un texto', 'NIVEL_CRAVING'],
    ['un código inválido', { codigo: 'nivel' }],
    ['un objeto sin código', {}],
  ])('rechaza %s con 422 VARIABLE_NODO_INVALIDA', (_caso, variable) => {
    expect(() => validarVariableNodo({ variable })).toThrow(
      expect.objectContaining({ codigo: 'VARIABLE_NODO_INVALIDA' }),
    );
  });
});

describe('RF-30B ValidarVariableNodoPolicy', () => {
  const policy = new ValidarVariableNodoPolicy();
  const { nivelCraving, contextoEmocional, situacionRiesgo } = variablesSeed;
  const conEntrada = (entrada: unknown, codigo = 'X_X') =>
    nodo({ texto: '¿?', entrada, variable: { codigo } });

  it('acepta las combinaciones de la taxonomía', () => {
    expect(() =>
      policy.validar(
        conEntrada({ tipo: 'ESCALA', min: 0, max: 10 }),
        'NIVEL_CRAVING',
        nivelCraving,
      ),
    ).not.toThrow();
    expect(() =>
      policy.validar(
        conEntrada({
          tipo: 'MULTISELECCION',
          opciones: ['ANSIEDAD', { valor: 'CALMA' }],
        }),
        'CONTEXTO_EMOCIONAL',
        contextoEmocional,
      ),
    ).not.toThrow();
    expect(() =>
      policy.validar(
        conEntrada({ tipo: 'BOOLEANO' }),
        'SITUACION_RIESGO',
        situacionRiesgo,
      ),
    ).not.toThrow();
  });

  it('VARIABLE_NO_VALIDA si no existe y VARIABLE_DESHABILITADA si está apagada', () => {
    const n = conEntrada({ tipo: 'ESCALA' });
    expect(() => policy.validar(n, 'NO_EXISTE', null)).toThrow(
      expect.objectContaining({ codigo: 'VARIABLE_NO_VALIDA' }),
    );
    expect(() =>
      policy.validar(n, 'NIVEL_CRAVING', nivelCraving.deshabilitar(false)),
    ).toThrow(expect.objectContaining({ codigo: 'VARIABLE_DESHABILITADA' }));
  });

  it.each([
    ['NIVEL_CRAVING con texto libre', { tipo: 'TEXTO_LIBRE' }, nivelCraving],
    [
      'CONTEXTO_EMOCIONAL con escala',
      { tipo: 'ESCALA', min: 0, max: 10 },
      contextoEmocional,
    ],
    [
      'SITUACION_RIESGO con opción única',
      { tipo: 'OPCION_UNICA', opciones: ['SI'] },
      situacionRiesgo,
    ],
  ])('TIPO_ENTRADA_INCOMPATIBLE: %s', (_caso, entrada, variable) => {
    expect(() =>
      policy.validar(conEntrada(entrada), variable.codigo, variable),
    ).toThrow(
      expect.objectContaining({
        codigo: 'TIPO_ENTRADA_INCOMPATIBLE',
        detalles: expect.objectContaining({
          tipos_entrada_permitidos: variable.tiposEntradaPermitidos,
        }) as unknown,
      }),
    );
  });

  it('un mensaje sin entrada es incompatible con cualquier variable', () => {
    const mensaje = nodo(
      { texto: 'Hola', variable: { codigo: 'NIVEL_CRAVING' } },
      { tipo: 'MENSAJE' },
    );
    expect(() =>
      policy.validar(mensaje, 'NIVEL_CRAVING', nivelCraving),
    ).toThrow(expect.objectContaining({ codigo: 'TIPO_ENTRADA_INCOMPATIBLE' }));
  });

  it('OPCIONES_FUERA_DE_TAXONOMIA lista las opciones ajenas', () => {
    expect(() =>
      policy.validar(
        conEntrada({ tipo: 'OPCION_UNICA', opciones: ['ANSIEDAD', 'HAMBRE'] }),
        'CONTEXTO_EMOCIONAL',
        contextoEmocional,
      ),
    ).toThrow(
      expect.objectContaining({
        codigo: 'OPCIONES_FUERA_DE_TAXONOMIA',
        detalles: expect.objectContaining({ opciones: ['HAMBRE'] }) as unknown,
      }),
    );
  });

  it('NODO_FINAL_CON_VARIABLE', () => {
    const final = nodo(
      { texto: 'Fin', variable: { codigo: 'NIVEL_CRAVING' } },
      { esNodoFinal: true },
    );
    expect(() => policy.validar(final, 'NIVEL_CRAVING', nivelCraving)).toThrow(
      expect.objectContaining({ codigo: 'NODO_FINAL_CON_VARIABLE' }),
    );
  });
});

describe('RF-30B EtiquetadoVariablePolicy', () => {
  const policy = new EtiquetadoVariablePolicy();

  it('no etiqueta respuestas vacías (nodo opcional)', () => {
    expect(policy.etiquetar(variablesSeed.contextoEmocional, [])).toBeNull();
    expect(policy.etiquetar(variablesSeed.nivelCraving, null)).toBeNull();
  });

  it('0 y false son respuestas presentes', () => {
    expect(policy.etiquetar(variablesSeed.nivelCraving, 0)).toEqual([
      { valor: 0, etiqueta: 'CRAVING_BAJO' },
    ]);
    expect(policy.etiquetar(variablesSeed.situacionRiesgo, false)).toEqual([
      { valor: false, etiqueta: 'RIESGO_AUSENTE' },
    ]);
  });

  it('COMPLETO solo con ambas dimensiones del perfil', () => {
    expect(
      policy.estado({
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.POSITIVO,
      }),
    ).toBe(EstadoEtiquetado.COMPLETO);
    expect(
      policy.estado({
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: null,
      }),
    ).toBe(EstadoEtiquetado.PENDIENTE_PERFIL);
  });
});
