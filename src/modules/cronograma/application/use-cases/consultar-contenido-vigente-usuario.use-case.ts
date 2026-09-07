import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaContenidoVigenteException } from '../../domain/exeption/consulta-contenido-vigente.exception';
import { ContenidoVigenteUsuarioRepository } from '../../domain/repositories/contenido-vigente-usuario.repository';
import { ContenidoVigenteDtoResponse } from '../dto/contenidoVigente/contenido-vigente.dto-response';

@Injectable()
export class ConsultarContenidoVigenteUsuarioUseCase {
  constructor(
    private readonly contenidoVigenteRepository: ContenidoVigenteUsuarioRepository,
  ) {}

  async execute(
    idUsuario: string,
    fechaConsulta: Date = new Date(),
  ): Promise<ContenidoVigenteDtoResponse[]> {
    try {
      const contenidos = await this.contenidoVigenteRepository.consultar(
        idUsuario,
        fechaConsulta,
      );

      return contenidos.map((contenido) =>
        ContenidoVigenteDtoResponse.crear(contenido),
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new ConsultaContenidoVigenteException();
    }
  }
}
