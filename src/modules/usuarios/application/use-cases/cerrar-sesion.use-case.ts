import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { Reloj } from '../ports/reloj';

export class CerrarSesionUseCase {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly reloj: Reloj,
  ) {}

  async execute(idSesion: string): Promise<{ mensaje: string }> {
    const cerrada = await this.sesionRepository.cerrar(
      idSesion,
      MotivoCierre.VOLUNTARIO,
      this.reloj.ahora(),
    );

    if (!cerrada) {
      throw new SesionInvalidaException();
    }

    return { mensaje: 'Sesión cerrada correctamente.' };
  }
}
