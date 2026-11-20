import { DimensionPerfilClinico as Dimension } from '../enums/perfil-clinico.enum';
import { ConfiguracionRespuestaInvalida } from '../exceptions/respuesta.exceptions';
import { extraerDimensionCapturaPerfil } from './dimension-captura-perfil';

describe('extraerDimensionCapturaPerfil', () => {
  it('devuelve null cuando el nodo no marca ninguna dimensión', () => {
    expect(extraerDimensionCapturaPerfil({ texto: 'Hola' })).toBeNull();
  });

  it.each([
    [Dimension.TIPO_DEPENDENCIA, { dimension: Dimension.TIPO_DEPENDENCIA }],
    [Dimension.TIPO_CRAVING, { dimension: Dimension.TIPO_CRAVING }],
  ] as const)('lee %s desde la forma objeto', (dimension, capturaPerfil) => {
    expect(
      extraerDimensionCapturaPerfil({ texto: 'Hola', capturaPerfil }),
    ).toBe(dimension);
  });

  it('lee la dimensión cuando viene como literal directo', () => {
    expect(
      extraerDimensionCapturaPerfil({
        capturaPerfil: Dimension.TIPO_CRAVING,
      }),
    ).toBe(Dimension.TIPO_CRAVING);
  });

  it.each([
    ['tipo_dependencia', Dimension.TIPO_DEPENDENCIA],
    ['tipo_craving', Dimension.TIPO_CRAVING],
  ] as const)(
    'conserva el alias legado captura_perfil=%s',
    (legado, dimension) => {
      expect(extraerDimensionCapturaPerfil({ captura_perfil: legado })).toBe(
        dimension,
      );
    },
  );

  it.each([true, [], {}, { dimension: 'OTRA' }, 'tipo_craving'])(
    'rechaza una marca de captura inválida %p',
    (capturaPerfil) => {
      expect(() => extraerDimensionCapturaPerfil({ capturaPerfil })).toThrow(
        ConfiguracionRespuestaInvalida,
      );
    },
  );

  it('rechaza dimensiones contradictorias entre el formato nuevo y el legado', () => {
    expect(() =>
      extraerDimensionCapturaPerfil({
        capturaPerfil: { dimension: Dimension.TIPO_CRAVING },
        captura_perfil: 'tipo_dependencia',
      }),
    ).toThrow(ConfiguracionRespuestaInvalida);
  });
});
