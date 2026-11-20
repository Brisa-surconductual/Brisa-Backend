import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { ModalidadConversacional } from '../enums/modalidad-conversacional-enum';
import { DimensionPerfilClinico } from '../enums/perfil-clinico.enum';
import { TipoEntradaRespuesta } from '../enums/tipo-entrada-respuesta.enum';
import {
  RespuestaUsuarioInvalida,
  configuracionRespuestaInvalida as configuracion,
} from '../exceptions/respuesta.exceptions';
import { CapturarRespuesta } from './capturar-respuesta.policy';
import { respuestaVacia } from './configuracion-entrada-respuesta';
import { DimensionPerfilCapturada } from '../repositories/perfil-clinico.repository';
import { CapturarDimensionPerfilPolicy } from './capturar-dimension-perfil.policy';
import { extraerDimensionCapturaPerfil } from './dimension-captura-perfil';

export type CapturaPerfilRespuesta = DimensionPerfilCapturada;

/** RF-27B: solo el árbol designa qué nodo captura cada dimensión. */
export class CapturaPerfilRespuestaPolicy {
  private readonly perfil = new CapturarDimensionPerfilPolicy();

  comprobarModalidad(
    nodo: NodoConversacional,
    modalidad: ModalidadConversacional,
  ): void {
    if (this.dimension(nodo) !== null)
      this.perfil.comprobarModalidad(modalidad);
  }

  capturar(
    nodo: NodoConversacional,
    valor: unknown,
  ): CapturaPerfilRespuesta | null {
    const dimension = this.dimension(nodo);
    if (dimension == null) return null;
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
    return this.perfil.validarValor(dimension, valor);
  }

  private dimension(nodo: NodoConversacional): DimensionPerfilClinico | null {
    return extraerDimensionCapturaPerfil(nodo.contenido);
  }
}
