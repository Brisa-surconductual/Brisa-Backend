import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { SesionRepository } from '../../domain/repositories/sesion.repository';
import { PasswordHasher } from '../ports/password-hasher';
import { SessionConfig } from '../ports/session-config';
import { SessionTokenGenerator } from '../ports/session-token-generator';
import { SessionTokenHasher } from '../ports/session-token-hasher';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Sesion } from '../../domain/entities/sesiones.entity';
import { CredencialesInvalidasException } from '../../domain/exeption/credenciales-invalidas.exception';
import { IniciarSesionDtoRequest } from '../dto/iniciar-sesion.dto-request';
import {
  IniciarSesionDtoResponse,
  SiguienteAccionSesion,
} from '../dto/iniciar-sesion.dto-response';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

const HASH_CREDENCIAL_INEXISTENTE =
  '$2b$12$jurWGh98YEJZnGRrfgi.qOWXK5uNqgLdhSYofSZuW.fwcqE8ZY4ke';

export interface ResultadoInicioSesion {
  tokenSesion: string;
  respuesta: IniciarSesionDtoResponse;
}

@Injectable()
export class IniciarSesionUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly sesionRepository: SesionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionConfig: SessionConfig,
    private readonly sessionTokenGenerator: SessionTokenGenerator,
    private readonly sessionTokenHasher: SessionTokenHasher,
  ) {}

  async execute(dto: IniciarSesionDtoRequest): Promise<ResultadoInicioSesion> {
    const correo = new CorreoElectronico(
      dto.correoElectronico.trim().toLowerCase(),
    );
    const usuario = await this.usuarioRepository.buscarPorCorreo(correo.value);
    const contrasenaValida = await this.passwordHasher.compare(
      dto.contrasena,
      usuario?.contrasenaHash ?? HASH_CREDENCIAL_INEXISTENTE,
    );

    if (
      !usuario ||
      !contrasenaValida ||
      String(usuario.estadoCuenta) !== EstadoCuenta.ACTIVA
    ) {
      throw new CredencialesInvalidasException();
    }

    const rol = String(usuario.rol);
    if (rol !== 'ESTUDIANTE' && rol !== 'ADMINISTRATIVO') {
      throw new InternalServerErrorException(
        'Error en la configuración de roles del usuario. Contacte al administrador del sistema.',
      );
    }

    const estadoRegistro = this.obtenerNombreEstadoRegistro(
      usuario.estadoRegistro,
    );
    const flujo = this.obtenerFlujo(estadoRegistro);
    const tokenSesion = this.sessionTokenGenerator.generarToken();
    const csrfToken = this.sessionTokenGenerator.generarToken();
    const tokenHash = await this.sessionTokenHasher.hash(tokenSesion);
    const csrfTokenHash = await this.sessionTokenHasher.hash(csrfToken);
    const sesion = Sesion.iniciar(
      usuario.id_usuario,
      tokenHash,
      csrfTokenHash,
      flujo.alcance,
      this.sessionConfig.obtenerLimiteInactividadMinutos(),
    );

    await this.sesionRepository.crear(sesion);

    return {
      tokenSesion,
      respuesta: IniciarSesionDtoResponse.crear({
        idUsuario: usuario.id_usuario,
        alcance: flujo.alcance,
        estadoRegistro,
        rol,
        siguienteAccion: flujo.siguienteAccion,
        limiteInactividadMinutos: sesion.limite_inactividad_minutos,
        csrfToken,
        mensaje: flujo.mensaje,
      }),
    };
  }

  private obtenerNombreEstadoRegistro(estado: EstadoRegistro): string {
    return typeof estado === 'string' ? estado : EstadoRegistro[estado];
  }

  private obtenerFlujo(estadoRegistro: string): {
    alcance: AlcanceSesion;
    siguienteAccion: SiguienteAccionSesion;
    mensaje: string;
  } {
    if (estadoRegistro === 'PENDIENTE_CONSENTIMIENTO') {
      return {
        alcance: AlcanceSesion.LIMITADA,
        siguienteAccion: 'COMPLETAR_CONSENTIMIENTO',
        mensaje: 'Debe completar el proceso de consentimiento para continuar.',
      };
    }

    if (estadoRegistro === 'PENDIENTE_REVISION') {
      return {
        alcance: AlcanceSesion.LIMITADA,
        siguienteAccion: 'REVISAR_REGISTRO',
        mensaje: 'Debe completar la revisión de datos para continuar.',
      };
    }

    if (estadoRegistro === 'REGISTRO_COMPLETO') {
      return {
        alcance: AlcanceSesion.COMPLETA,
        siguienteAccion: 'INGRESAR',
        mensaje: 'Inicio de sesión exitoso.',
      };
    }

    throw new InternalServerErrorException(
      'No fue posible procesar la solicitud en este momento. Intente nuevamente más tarde.',
    );
  }
}
