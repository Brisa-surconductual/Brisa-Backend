import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaContenidoVigenteException } from '../../domain/exeption/contenido/consulta-contenido-vigente.exception';
import { ModuloConsultaContenidoNoAutorizadoException } from '../../domain/exeption/modulo/modulo-consulta-contenido-no-autorizado.exception';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { ContenidoVigenteDtoResponse } from '../dto/contenidoVigente/contenido-vigente.dto-response';
import {
  CodigoModuloConsultaContenido,
  ConsultaContenidoVigentePort,
} from '../ports/consulta-contenido-vigente.port';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../use-cases/contenido/consultar-contenido-vigente-usuario.use-case';

const MODULOS_AUTORIZADOS: readonly CodigoModuloConsultaContenido[] = [
  'CHAT',
  'SEGUIM',
  'GAMIF',
  'NOTIF',
];

@Injectable()
export class ConsultaContenidoVigenteService extends ConsultaContenidoVigentePort {
  constructor(
    private readonly moduloRepository: ModuloSistemaRepository,
    private readonly consultarContenido: ConsultarContenidoVigenteUsuarioUseCase,
  ) {
    super();
  }

  async consultar(
    idUsuario: string,
    codigoModulo: CodigoModuloConsultaContenido,
  ): Promise<ContenidoVigenteDtoResponse[]> {
    try {
      if (!MODULOS_AUTORIZADOS.includes(codigoModulo)) {
        throw new ModuloConsultaContenidoNoAutorizadoException();
      }

      const modulo =
        await this.moduloRepository.buscarActivoPorCodigo(codigoModulo);
      if (!modulo) {
        throw new ModuloConsultaContenidoNoAutorizadoException();
      }

      return await this.consultarContenido.execute(idUsuario);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaContenidoVigenteException();
    }
  }
}
