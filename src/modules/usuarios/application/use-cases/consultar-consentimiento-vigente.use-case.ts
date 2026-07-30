import { ConsentimientoNoDisponibleException } from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';

export class ConsultarConsentimientoVigenteUseCase {
  constructor(private readonly registroRepository: RegistroRepository) {}

  async execute() {
    const consentimiento =
      await this.registroRepository.obtenerConsentimientoVigente();

    if (!consentimiento) {
      throw new ConsentimientoNoDisponibleException();
    }

    return consentimiento;
  }
}
