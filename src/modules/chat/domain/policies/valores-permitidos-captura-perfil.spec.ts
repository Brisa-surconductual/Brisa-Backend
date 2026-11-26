import {
  DimensionPerfilClinico as Dimension,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { valoresPermitidosCoincidenConDominio } from './valores-permitidos-captura-perfil';

describe('valoresPermitidosCoincidenConDominio (RF-25)', () => {
  it('acepta TIPO_DEPENDENCIA con exactamente los dos valores clínicos', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_DEPENDENCIA, [
        TipoDependenciaClinica.ABSTINENCIA_FISICA,
        TipoDependenciaClinica.TOLERANCIA,
      ]),
    ).toBe(true);
  });

  it('acepta TIPO_CRAVING con exactamente los dos valores clínicos, en otro orden', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_CRAVING, [
        TipoCravingClinico.NEGATIVO,
        TipoCravingClinico.POSITIVO,
      ]),
    ).toBe(true);
  });

  it('rechaza una lista vacía', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_DEPENDENCIA, []),
    ).toBe(false);
  });

  it('rechaza valores de otra dimensión', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_DEPENDENCIA, [
        TipoCravingClinico.POSITIVO,
        TipoCravingClinico.NEGATIVO,
      ]),
    ).toBe(false);
  });

  it('rechaza un valor extra fuera del dominio', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_CRAVING, [
        TipoCravingClinico.POSITIVO,
        TipoCravingClinico.NEGATIVO,
        'OTRO',
      ]),
    ).toBe(false);
  });

  it('rechaza solo uno de los dos valores esperados', () => {
    expect(
      valoresPermitidosCoincidenConDominio(Dimension.TIPO_DEPENDENCIA, [
        TipoDependenciaClinica.TOLERANCIA,
      ]),
    ).toBe(false);
  });
});
