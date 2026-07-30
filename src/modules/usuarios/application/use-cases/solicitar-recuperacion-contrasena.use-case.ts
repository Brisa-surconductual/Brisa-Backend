import { addMinutes, subHours } from './time-utils';
import { EstadoCodigo } from '../../domain/enums/estado-codigo-enum';
import { EstadoCuenta } from '../../domain/enums/estado-cuenta';
import { LimiteRecuperacionExcedidoException } from '../../domain/exceptions/usuario.exceptions';
import { RecuperacionContrasenaRepository } from '../../domain/repositories/recuperacion-contrasena.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { CorreoElectronico } from '../../domain/value-objects/correo_electronico.vo';
import { EmailSender } from '../ports/email-sender';
import { RecoveryTokenService } from '../ports/recovery-token.service';
import { Reloj } from '../ports/reloj';

export const MENSAJE_RECUPERACION_GENERICO =
  'Si el correo está registrado, recibirás instrucciones en unos minutos.';

export class SolicitarRecuperacionContrasenaUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly recuperacionRepository: RecuperacionContrasenaRepository,
    private readonly tokenService: RecoveryTokenService,
    private readonly emailSender: EmailSender,
    private readonly reloj: Reloj,
  ) {}

  async execute(correoEntrada: string, direccionIp: string) {
    const correo = new CorreoElectronico(correoEntrada).getValue();
    const ahora = this.reloj.ahora();
    const intentos = await this.recuperacionRepository.contarSolicitudesDesde(
      correo,
      direccionIp,
      subHours(ahora, 1),
    );

    if (intentos >= 3) {
      throw new LimiteRecuperacionExcedidoException();
    }

    const usuario = await this.usuarioRepository.buscarPorCorreo(correo);

    if (usuario?.getEstadoCuenta() === EstadoCuenta.ACTIVA) {
      const token = this.tokenService.generar();
      const fechaExpiracion = addMinutes(ahora, 15);

      await this.recuperacionRepository.registrar({
        correoElectronico: correo,
        direccionIp,
        idUsuario: usuario.getId(),
        codigoHash: this.tokenService.hash(token),
        fechaExpiracion,
        estado: EstadoCodigo.ACTIVO,
      });

      try {
        await this.emailSender.enviarRecuperacion({
          destinatario: correo,
          token,
          fechaExpiracion,
        });
      } catch {
        // RF-07 requires the same response even when the mail service fails.
      }
    } else {
      await this.recuperacionRepository.registrar({
        correoElectronico: correo,
        direccionIp,
        idUsuario: usuario?.getId() ?? null,
        codigoHash: null,
        fechaExpiracion: null,
        estado: EstadoCodigo.EXPIRADO,
      });

      if (usuario?.getEstadoCuenta() === EstadoCuenta.PENDIENTE_ACTIVACION) {
        try {
          await this.emailSender.enviarActivacionPendiente(correo);
        } catch {
          // Keep the response indistinguishable to prevent account enumeration.
        }
      }
    }

    return { mensaje: MENSAJE_RECUPERACION_GENERICO };
  }
}
