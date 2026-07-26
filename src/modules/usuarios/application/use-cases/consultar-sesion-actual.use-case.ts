import { obtenerPermisosPorRol } from '../../domain/services/permisos-por-rol';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export class ConsultarSesionActualUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(idUsuario: string) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      throw new SesionInvalidaException();
    }

    return {
      idUsuario: usuario.getId(),
      correoElectronico: usuario.getCorreo().getValue(),
      rol: usuario.getRol(),
      estadoRegistro: usuario.getEstadoRegistro(),
      siguientePaso: obtenerSiguientePaso(usuario.getEstadoRegistro()),
      permisos: obtenerPermisosPorRol(usuario.getRol()),
    };
  }
}
