import { Usuario } from '../entities/usuarios.entity';

export abstract class UsuarioRepository {
  abstract crear(usuario: Usuario): Promise<void>;
  abstract buscarPorCorreo(correo: string): Promise<Usuario | null>;
  abstract buscarPorId(idUsuario: string): Promise<Usuario | null>;
  abstract actualizarContrasena(
    idUsuario: string,
    contrasenaHash: string,
  ): Promise<void>;
}
