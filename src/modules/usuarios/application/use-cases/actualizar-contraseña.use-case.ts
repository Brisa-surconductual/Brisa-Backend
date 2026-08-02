import {Injectable} from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { ActualizacionContrasenaDtoRequest } from '../dto/actualizacion-contrasena.dto-request';
import { ActualizacionContrasenaDtoResponse } from '../dto/actualizacion-contrasena.dto-response';
import {RecuperacionRepository} from '../../domain/repositories/recuperacion.repository';
import {PasswordHasher} from '../ports/password-hasher';
import { Usuario } from '../../domain/entities/usuarios.entity';
import { CodigoRecuperacionInvalidoException } from '../../domain/exeption/codigo-recuperacion-invaliado.exeption';
import { UsuarioNoEncontradoException } from '../../domain/exeption/usuario-no-encontrado.exception';

@Injectable()
export class ActualizarContrasenaUseCase {
    constructor(
        private readonly usuarioRepository: UsuarioRepository,
        private readonly recuperacionRepository: RecuperacionRepository,
        private readonly passwordHasher: PasswordHasher
    ) {}
    
    async execute(dto: ActualizacionContrasenaDtoRequest): Promise<ActualizacionContrasenaDtoResponse> {


        const solicitud = await this.recuperacionRepository.buscarPorCodigo(dto.codigo);

        if (!solicitud) {
            throw new CodigoRecuperacionInvalidoException();
        }

        if (!solicitud.esValida()) {
            throw new CodigoRecuperacionInvalidoException();
        }

        const usuario = await this.usuarioRepository.buscarPorId(
            solicitud.idUsuario,
        );

        if (!usuario) {
            throw new UsuarioNoEncontradoException();
        }

        const hash = await this.passwordHasher.hash(dto.nuevaContrasena);

        const usuarioActualizado = Usuario.actualizarContrasena(usuario, hash);

        await this.usuarioRepository.actualizar(usuarioActualizado);

        await this.recuperacionRepository.actualizar(
            solicitud.marcarComoUsada(),
        );

        return ActualizacionContrasenaDtoResponse.crear();

    }
}