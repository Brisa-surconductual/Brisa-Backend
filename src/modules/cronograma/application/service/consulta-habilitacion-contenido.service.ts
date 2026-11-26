import { HttpException, Injectable } from '@nestjs/common';
import { ConsultaContenidoVigenteException } from '../../domain/exeption/contenido/consulta-contenido-vigente.exception';
import {
  ContenidoVigenteUsuarioRepository,
  HabilitacionContenidoUsuario,
} from '../../domain/repositories/contenido-vigente-usuario.repository';
import { ConsultaHabilitacionContenidoPort } from '../ports/consulta-habilitacion-contenido.port';

/** RF-24 / RF-22: habilitación de un contenido para el usuario, a la fecha actual. */
@Injectable()
export class ConsultaHabilitacionContenidoService extends ConsultaHabilitacionContenidoPort {
  constructor(private readonly repository: ContenidoVigenteUsuarioRepository) {
    super();
  }

  async consultar(
    idUsuario: string,
    idContenido: string,
  ): Promise<HabilitacionContenidoUsuario> {
    try {
      return await this.repository.consultarHabilitacion(
        idUsuario,
        idContenido,
        new Date(),
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new ConsultaContenidoVigenteException();
    }
  }
}
