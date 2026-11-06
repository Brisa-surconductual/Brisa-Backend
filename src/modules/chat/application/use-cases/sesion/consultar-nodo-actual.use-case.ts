import { HttpException, Injectable } from '@nestjs/common';
import {
  DomainException,
  NodoActualNoEncontradoException,
  SesionConversacionalNoEncontradaException,
  SesionErrorConfiguracionException,
} from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import {
  ConsultaNodoActualDtoResponse,
  NodoActualDtoResponse,
} from '../../dto/sesion-conversacional.dto-response';
import { ContenidoNodoNoDisponibleException } from '../../exceptions/contenido-nodo-no-disponible.exception';

/** RF-26: lee el puntero persistido; no inicia, reanuda ni avanza la sesión. */
@Injectable()
export class ConsultarNodoActualUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly arboles: ArbolConversacionalRepository,
  ) {}

  async execute(
    idSesion: string,
    idUsuario: string,
  ): Promise<ConsultaNodoActualDtoResponse> {
    try {
      const sesion = await this.sesiones.buscarPorIdYUsuario(
        idSesion,
        idUsuario,
      );
      if (sesion === null)
        throw new SesionConversacionalNoEncontradaException();
      if (sesion.tieneErrorConfiguracion)
        throw new SesionErrorConfiguracionException();
      if (sesion.idNodoActual === null)
        throw new NodoActualNoEncontradoException();

      const nodo = await this.arboles.buscarNodo(sesion.idNodoActual);
      if (nodo === null || nodo.idFlujo !== sesion.idFlujoConversacional) {
        throw new NodoActualNoEncontradoException();
      }
      // No exige texto, formato, catálogos de entrada ni reglas de validación.
      if (nodo.contenido == null)
        throw new ContenidoNodoNoDisponibleException();
      return { nodo_actual: NodoActualDtoResponse.desde(nodo) };
    } catch (error: unknown) {
      if (error instanceof DomainException || error instanceof HttpException)
        throw error;
      throw new ContenidoNodoNoDisponibleException();
    }
  }
}
