import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';
import { TipoEntradaRespuesta } from '../enums/tipo-entrada-respuesta.enum';
import {
  ConflictoRespuestaConversacionalException,
  RespuestaUsuarioInvalida,
  configuracionRespuestaInvalida as configuracion,
} from '../exceptions/respuesta.exceptions';
import { CapturarRespuesta } from './capturar-respuesta.policy';
import { respuestaVacia } from './configuracion-entrada-respuesta';

export type CapturaPerfilRespuesta =
  | { dimension: 'tipo_dependencia'; valor: TipoDependenciaClinica }
  | { dimension: 'tipo_craving'; valor: TipoCravingClinico };

/** RF-27B: solo el árbol designa qué nodo captura cada dimensión. */
export class CapturaPerfilRespuestaPolicy {
  comprobarModalidad(
    nodo: NodoConversacional,
    modalidad: ModalidadConversacional,
  ): void {
    if (
      nodo.contenido.captura_perfil != null &&
      modalidad !== ModalidadConversacional.GRUPAL
    )
      throw new ConflictoRespuestaConversacionalException(
        'La captura de perfil clínico solo aplica durante la modalidad de terapia grupal.',
        'CAPTURA_FUERA_DE_GRUPAL',
      );
  }

  capturar(
    nodo: NodoConversacional,
    valor: unknown,
  ): CapturaPerfilRespuesta | null {
    const dimension = nodo.contenido.captura_perfil;
    if (dimension == null) return null;
    if (dimension !== 'tipo_dependencia' && dimension !== 'tipo_craving')
      return configuracion('Dimensión clínica no configurada.');
    if (
      new CapturarRespuesta().entrada(nodo).tipo !==
      TipoEntradaRespuesta.OPCION_UNICA
    )
      configuracion('La captura clínica requiere selección única.');
    if (respuestaVacia(valor))
      throw new RespuestaUsuarioInvalida(
        'Este campo es obligatorio.',
        'RESPUESTA_OBLIGATORIA',
      );
    const valores: string[] =
      dimension === 'tipo_dependencia'
        ? Object.values(TipoDependenciaClinica)
        : Object.values(TipoCravingClinico);
    if (typeof valor !== 'string' || !valores.includes(valor))
      throw new RespuestaUsuarioInvalida(
        'La respuesta seleccionada no es válida para esta pregunta.',
        'VALOR_NO_PERMITIDO',
      );
    return dimension === 'tipo_dependencia'
      ? { dimension, valor: valor as TipoDependenciaClinica }
      : { dimension, valor: valor as TipoCravingClinico };
  }
}
