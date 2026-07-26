import { EstadoAplicacion } from '../../domain/enums/estado-aplicacion-enum';
import { MotivoCierre } from '../../domain/enums/motivo-cierre-enum';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';
import {
  SesionPersistida,
  SesionRepository,
} from '../../domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { AccessTokenClaims } from '../ports/access-token.service';
import { Reloj } from '../ports/reloj';

export class ValidarSesionUseCase {
  constructor(
    private readonly sesionRepository: SesionRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly reloj: Reloj,
    private readonly limiteSegundoPlanoMinutos: number,
  ) {}

  async execute(
    claims: AccessTokenClaims,
  ): Promise<{ sesion: SesionPersistida; claims: AccessTokenClaims }> {
    const sesion = await this.sesionRepository.buscarSesionPorId(claims.sid);

    if (!sesion || !sesion.activa || sesion.idUsuario !== claims.sub) {
      throw new SesionInvalidaException();
    }

    const ahora = this.reloj.ahora();
    const minutosSinInteraccion =
      (ahora.getTime() - sesion.fechaUltimaInteraccion.getTime()) / 60_000;
    const estaEnSegundoPlano =
      sesion.estadoAplicacion === EstadoAplicacion.SEGUNDO_PLANO;
    const limite = estaEnSegundoPlano
      ? this.limiteSegundoPlanoMinutos
      : sesion.limiteInactividadMinutos;

    if (minutosSinInteraccion >= limite) {
      await this.sesionRepository.cerrar(
        sesion.id,
        estaEnSegundoPlano
          ? MotivoCierre.SEGUNDO_PLANO
          : MotivoCierre.INACTIVIDAD,
        ahora,
      );
      throw new SesionInvalidaException(
        estaEnSegundoPlano
          ? 'La sesión fue cerrada por seguridad.'
          : 'La sesión fue cerrada por inactividad.',
      );
    }

    await this.sesionRepository.registrarInteraccion(sesion.id, ahora);
    const usuario = await this.usuarioRepository.buscarPorId(claims.sub);
    if (!usuario) {
      throw new SesionInvalidaException();
    }

    return {
      sesion,
      claims: {
        ...claims,
        rol: usuario.getRol(),
        estadoRegistro: usuario.getEstadoRegistro(),
      },
    };
  }
}
