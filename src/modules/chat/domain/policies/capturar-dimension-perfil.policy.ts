import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import {
  DimensionPerfilClinico,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import {
  ConflictoRespuestaConversacionalException,
  RespuestaUsuarioInvalida,
  configuracionRespuestaInvalida,
} from '../exceptions/respuesta.exceptions';
import { DimensionPerfilCapturada } from '../repositories/perfil-clinico.repository';

export class CapturarDimensionPerfilPolicy {
  comprobarModalidad(modalidad: ModalidadConversacional): void {
    if (modalidad !== ModalidadConversacional.GRUPAL)
      throw new ConflictoRespuestaConversacionalException(
        'La captura de perfil clínico solo aplica durante la modalidad de terapia grupal.',
        'CAPTURA_FUERA_DE_GRUPAL',
      );
  }

  validarValor(
    dimension: DimensionPerfilClinico,
    valor: unknown,
  ): DimensionPerfilCapturada {
    if (!Object.values(DimensionPerfilClinico).includes(dimension))
      return configuracionRespuestaInvalida(
        'Dimensión clínica no configurada.',
      );
    const valores: string[] =
      dimension === DimensionPerfilClinico.TIPO_DEPENDENCIA
        ? Object.values(TipoDependenciaClinica)
        : Object.values(TipoCravingClinico);
    if (typeof valor !== 'string' || !valores.includes(valor))
      throw new RespuestaUsuarioInvalida(
        'La respuesta seleccionada no es válida para esta pregunta.',
        'VALOR_NO_PERMITIDO',
      );
    return dimension === DimensionPerfilClinico.TIPO_DEPENDENCIA
      ? { dimension, valor: valor as TipoDependenciaClinica }
      : { dimension, valor: valor as TipoCravingClinico };
  }
}
