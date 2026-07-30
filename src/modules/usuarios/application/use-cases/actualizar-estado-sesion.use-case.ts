import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { Reloj } from '../ports/reloj';

export class ActualizarEstadoSesionUseCase {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly reloj: Reloj,
  ) {}

  async execute(
    idSesion: string,
    estado: EstadoAplicacion,
  ): Promise<{ estadoAplicacion: EstadoAplicacion }> {
    await this.sesionRepository.actualizarEstadoAplicacion(
      idSesion,
      estado,
      this.reloj.ahora(),
    );
    return { estadoAplicacion: estado };
  }
}
