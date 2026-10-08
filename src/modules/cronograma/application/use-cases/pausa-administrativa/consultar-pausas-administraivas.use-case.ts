import { PausaAdministrativaRepository } from '../../../domain/repositories/pausa-administrativa.repository';
import { ConsultarPausasAdministrativasUsuarioDtoResponse } from '../../dto/pausaAdministrativa/conusltar-pausas-administarivas.dto-response';
import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../../../usuarios/domain/repositories/user.repository';

@Injectable()
export class ConsultarPausasAdministraivasUseCase {
  constructor(
    private readonly pausaRepository: PausaAdministrativaRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async execute(): Promise<ConsultarPausasAdministrativasUsuarioDtoResponse[]> {
    const pausas = await this.pausaRepository.listarPausasAdministrativas();

    const pausasConUsuario = await Promise.all(
      pausas.map(async (pausa) => {
        const usuario = await this.usuarioRepository.buscarPorId(
          pausa.id_usuario || pausa.id_usuario,
        );

        const usuarioAdministrativo = await this.usuarioRepository.buscarPorId(
          pausa.id_usuario_administrativo || pausa.id_usuario_administrativo,
        );

        return {
          ...pausa,
          emailUsuario: usuario ? usuario.correo : 'Usuario sin correo',
          correoUsuarioAdministrativo: usuarioAdministrativo ? usuarioAdministrativo.correo : 'Usuario administrativo sin correo',
        };
      }),
    );

    return pausasConUsuario.map((pausaExtendida) =>
      ConsultarPausasAdministrativasUsuarioDtoResponse.response(pausaExtendida),
    );
  }
}
