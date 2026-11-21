import { HttpException, Injectable } from '@nestjs/common';
import {
  DomainException,
  SesionConversacionalNoEncontradaException,
} from '../../../domain/exceptions';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { ConsultarHistorialInteraccionesDtoRequest } from '../../dto/historial-interacciones.dto-request';
import { HistorialInteraccionesDtoResponse } from '../../dto/historial-interacciones.dto-response';
import { ContenidoNodoNoDisponibleException } from '../../exceptions/contenido-nodo-no-disponible.exception';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { PresentarHistorialConversacionalService } from '../../services/presentar-historial-conversacional.service';

@Injectable()
export class ConsultarHistorialInteraccionesUseCase {
  constructor(
    private readonly sesiones: SesionConversacionalRepository,
    private readonly historial: HistorialInteraccionesRepository,
    private readonly presentacion: PresentarHistorialConversacionalService,
  ) {}

  async execute(
    idSesion: string,
    idUsuario: string,
    consulta: ConsultarHistorialInteraccionesDtoRequest,
  ): Promise<HistorialInteraccionesDtoResponse> {
    try {
      const sesion = await this.sesiones.buscarPorIdYUsuario(
        idSesion,
        idUsuario,
      );
      if (sesion === null)
        throw new SesionConversacionalNoEncontradaException();

      const pagina = await this.historial.consultar({
        idSesion: sesion.idSesion,
        antesDe: consulta.antes_de_secuencia ?? null,
        limite: consulta.limite,
      });
      if (pagina === null)
        throw new HistorialConversacionalInconsistenteException();

      return {
        data: await this.presentacion.presentar(
          pagina,
          sesion.idFlujoConversacional,
        ),
      };
    } catch (error: unknown) {
      if (error instanceof DomainException || error instanceof HttpException)
        throw error;
      throw new ContenidoNodoNoDisponibleException();
    }
  }
}
