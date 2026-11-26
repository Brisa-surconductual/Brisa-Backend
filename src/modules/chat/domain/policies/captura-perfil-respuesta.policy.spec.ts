import { nodoRespuesta } from '../../application/support/testing/respuesta-fixtures';
import { ModalidadConversacional as Modalidad } from '../enums/modalidad-conversacional-enum';
import {
  DimensionPerfilClinico as Dimension,
  TipoCravingClinico as Craving,
  TipoDependenciaClinica as Dependencia,
} from '../enums/perfil-clinico.enum';
import {
  ConfiguracionRespuestaInvalida,
  ConflictoRespuestaConversacionalException,
  RespuestaUsuarioInvalida,
} from '../exceptions/respuesta.exceptions';
import { CapturaPerfilRespuestaPolicy } from './captura-perfil-respuesta.policy';
import { CapturarDimensionPerfilPolicy } from './capturar-dimension-perfil.policy';

describe('RF-27B designación y validación de captura clínica', () => {
  const policy = new CapturaPerfilRespuestaPolicy();
  const clinica = new CapturarDimensionPerfilPolicy();
  const nodo = (captura: unknown, tipo = 'OPCION_UNICA') => {
    const n = nodoRespuesta({ tipo });
    n.contenido.capturaPerfil = captura;
    return n;
  };

  it.each([
    [Dimension.TIPO_DEPENDENCIA, Dependencia.ABSTINENCIA_FISICA],
    [Dimension.TIPO_DEPENDENCIA, Dependencia.TOLERANCIA],
    [Dimension.TIPO_CRAVING, Craving.POSITIVO],
    [Dimension.TIPO_CRAVING, Craving.NEGATIVO],
  ] as const)('captura %s=%s desde el nodo designado', (dimension, valor) => {
    const n = nodo({ dimension });
    expect(() => policy.comprobarModalidad(n, Modalidad.GRUPAL)).not.toThrow();
    expect(policy.capturar(n, valor)).toEqual({ dimension, valor });
  });

  it('también admite la dimensión literal en capturaPerfil', () => {
    expect(
      policy.capturar(nodo(Dimension.TIPO_CRAVING), Craving.POSITIVO),
    ).toEqual({ dimension: Dimension.TIPO_CRAVING, valor: Craving.POSITIVO });
  });

  it.each([
    ['tipo_dependencia', Dimension.TIPO_DEPENDENCIA, Dependencia.TOLERANCIA],
    ['tipo_craving', Dimension.TIPO_CRAVING, Craving.NEGATIVO],
  ] as const)(
    'conserva los árboles con captura_perfil=%s',
    (legado, dimension, valor) => {
      const n = nodoRespuesta({ tipo: 'SELECCION_UNICA' });
      n.contenido.captura_perfil = legado;
      expect(policy.capturar(n, valor)).toEqual({ dimension, valor });
      n.contenido.capturaPerfil = { dimension };
      expect(policy.capturar(n, valor)).toEqual({ dimension, valor });
    },
  );

  it.each([
    [Dimension.TIPO_DEPENDENCIA, Craving.POSITIVO],
    [Dimension.TIPO_CRAVING, Dependencia.TOLERANCIA],
    [Dimension.TIPO_DEPENDENCIA, 'BAJA'],
    [Dimension.TIPO_CRAVING, 'positivo'],
    [Dimension.TIPO_CRAVING, 1],
    [Dimension.TIPO_CRAVING, ['POSITIVO']],
  ] as const)('rechaza valor ajeno a %s: %p', (dimension, valor) => {
    expect(() => clinica.validarValor(dimension, valor)).toThrow(
      RespuestaUsuarioInvalida,
    );
    try {
      clinica.validarValor(dimension, valor);
    } catch (error: unknown) {
      expect(error).toMatchObject({ codigo: 'VALOR_NO_PERMITIDO' });
    }
  });

  it.each([null, undefined, '', []])(
    'la captura del POST exige una respuesta: %p',
    (valor) => {
      expect(() =>
        policy.capturar(nodo({ dimension: Dimension.TIPO_CRAVING }), valor),
      ).toThrow(RespuestaUsuarioInvalida);
    },
  );

  it.each(['TEXTO_LIBRE', 'MULTISELECCION', 'NUMERICO', 'BOOLEANO'])(
    'no admite captura clínica mediante %s',
    (tipo) => {
      expect(() =>
        policy.capturar(
          nodo({ dimension: Dimension.TIPO_DEPENDENCIA }, tipo),
          Dependencia.TOLERANCIA,
        ),
      ).toThrow(ConfiguracionRespuestaInvalida);
    },
  );

  it('rechaza captura personalizada y no restringe nodos normales', () => {
    expect(() =>
      policy.comprobarModalidad(
        nodo({ dimension: Dimension.TIPO_CRAVING }),
        Modalidad.PERSONALIZADA,
      ),
    ).toThrow(ConflictoRespuestaConversacionalException);
    expect(() =>
      policy.comprobarModalidad(nodoRespuesta(), Modalidad.PERSONALIZADA),
    ).not.toThrow();
    expect(policy.capturar(nodoRespuesta(), Dependencia.TOLERANCIA)).toBeNull();
  });

  it.each([true, [], {}, { dimension: 'OTRA' }, 'tipo_craving'])(
    'rechaza configuración inválida %p sin atribuirla al usuario',
    (captura) => {
      expect(() => policy.capturar(nodo(captura), Craving.POSITIVO)).toThrow(
        ConfiguracionRespuestaInvalida,
      );
    },
  );

  it('no elige silenciosamente entre dos dimensiones contradictorias', () => {
    const n = nodo({ dimension: Dimension.TIPO_CRAVING });
    n.contenido.captura_perfil = 'tipo_dependencia';
    expect(() => policy.capturar(n, Craving.POSITIVO)).toThrow(
      ConfiguracionRespuestaInvalida,
    );
  });
});
