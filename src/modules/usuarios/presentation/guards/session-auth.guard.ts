import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { SesionNoActivaException } from '../../domain/exeption/sesion-no-activa.exception';
import { SessionConfig } from '../../application/ports/session-config';
import { SessionCookieConfig } from '../../application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../application/ports/session-token-hasher';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { AuthenticatedSessionRequest } from '../http/authenticated-session-request';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly sessionConfig: SessionConfig,
    private readonly cookieConfig: SessionCookieConfig,
    private readonly sessionTokenHasher: SessionTokenHasher,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedSessionRequest>();
    const token = this.obtenerToken(request);
    const tokenHash = await this.sessionTokenHasher.hash(token);
    const sesion =
      await this.sesionRepository.buscarActivaPorTokenHash(tokenHash);

    if (!sesion || !sesion.csrf_token_hash) {
      throw new SesionNoActivaException();
    }

    const ahora = new Date();
    const motivoExpiracion = sesion.obtenerMotivoExpiracion(
      ahora,
      this.sessionConfig.obtenerLimiteSegundoPlanoMinutos(),
    );

    if (motivoExpiracion !== null) {
      await this.sesionRepository.cerrarActiva(
        sesion.id_sesion,
        ahora,
        motivoExpiracion,
      );
      throw new SesionNoActivaException();
    }

    const usuario = await this.usuarioRepository.buscarPorId(sesion.id_usuario);
    if (!usuario || String(usuario.estadoCuenta) !== EstadoCuenta.ACTIVA) {
      throw new SesionNoActivaException();
    }

    const rol = String(usuario.rol);
    if (rol !== 'ESTUDIANTE' && rol !== 'ADMINISTRATIVO') {
      throw new InternalServerErrorException(
        'Error en la configuración de roles del usuario. Contacte al administrador del sistema.',
      );
    }

    const actualizada = await this.sesionRepository.registrarActividad(
      sesion.id_sesion,
      ahora,
      sesion.estado_aplicacion,
    );
    if (!actualizada) {
      throw new SesionNoActivaException();
    }

    request.autenticacion = { sesion, usuario };
    return true;
  }

  private obtenerToken(request: AuthenticatedSessionRequest): string {
    const nombreCookie = this.cookieConfig.obtenerNombreCookie();
    const token = request.cookies?.[nombreCookie] as unknown;

    if (typeof token !== 'string' || token.length === 0) {
      throw new SesionNoActivaException();
    }

    return token;
  }
}
