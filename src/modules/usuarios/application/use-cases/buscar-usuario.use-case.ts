import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class BuscarUsuariosUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(termino?: string) {
    const usuarios = await this.usuarioRepository.buscarPorTermino(
      termino || '',
    );

    return usuarios.map((usuario) => ({
      idUsuario: usuario.id_usuario,
      correoElectronico: usuario.correo,
    }));
  }
}
