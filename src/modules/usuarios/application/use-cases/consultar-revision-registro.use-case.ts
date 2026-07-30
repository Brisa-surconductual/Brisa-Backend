import { EstadoRegistroInvalidoException } from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';

export class ConsultarRevisionRegistroUseCase {
  constructor(private readonly registroRepository: RegistroRepository) {}

  async execute(idUsuario: string) {
    const revision = await this.registroRepository.obtenerRevision(idUsuario);

    if (!revision) {
      throw new EstadoRegistroInvalidoException(
        'No hay información de línea base disponible para revisión.',
      );
    }

    return {
      idUsuario: revision.idUsuario,
      correoElectronico: revision.correoElectronico,
      estadoRegistro: revision.estadoRegistro,
      consentimientoVigente: revision.consentimientoVigente,
      versionConsentimiento: revision.versionConsentimiento,
      lineaBase: revision.lineaBase.toDatos(),
    };
  }
}
