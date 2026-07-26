import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import {
  ConsentimientoNoVigenteException,
  EstadoRegistroInvalidoException,
} from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export class ConfirmarRegistroUseCase {
  constructor(private readonly registroRepository: RegistroRepository) {}

  async execute(idUsuario: string) {
    const revision = await this.registroRepository.obtenerRevision(idUsuario);

    if (
      !revision ||
      revision.estadoRegistro !== EstadoRegistro.PENDIENTE_REVISION
    ) {
      throw new EstadoRegistroInvalidoException();
    }

    if (!revision.consentimientoVigente) {
      throw new ConsentimientoNoVigenteException();
    }

    await this.registroRepository.confirmarRegistro(idUsuario);

    return {
      estadoRegistro: EstadoRegistro.REGISTRO_COMPLETO,
      siguientePaso: obtenerSiguientePaso(EstadoRegistro.REGISTRO_COMPLETO),
      mensaje: 'Registro confirmado correctamente.',
    };
  }
}
