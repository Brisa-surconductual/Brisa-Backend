import {
  LineaBase,
  LineaBaseDatos,
} from '../../domain/entities/linea-bases.entity';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Rol } from '../../domain/enums/rol.enum';
import {
  AccesoDenegadoException,
  ConsentimientoNoDisponibleException,
  ConsentimientoRequeridoException,
  EstadoRegistroInvalidoException,
} from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';
import { UsuarioRepository } from '../../domain/repositories/user.repository';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export interface CompletarConsentimientoLineaBaseInput {
  idConsentimiento: string;
  consentimientoAceptado: boolean;
  registroConsumoAutorizado: boolean;
  lineaBase: LineaBaseDatos;
}

export class CompletarConsentimientoLineaBaseUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly registroRepository: RegistroRepository,
  ) {}

  async execute(
    idUsuario: string,
    input: CompletarConsentimientoLineaBaseInput,
  ) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);

    if (!usuario) {
      throw new EstadoRegistroInvalidoException();
    }

    if (usuario.getRol() !== Rol.ESTUDIANTE) {
      throw new AccesoDenegadoException();
    }

    if (
      usuario.getEstadoRegistro() !== EstadoRegistro.PENDIENTE_CONSENTIMIENTO
    ) {
      throw new EstadoRegistroInvalidoException();
    }

    if (!input.consentimientoAceptado || !input.registroConsumoAutorizado) {
      throw new ConsentimientoRequeridoException();
    }

    const consentimiento =
      await this.registroRepository.obtenerConsentimientoVigente();
    if (!consentimiento || consentimiento.id !== input.idConsentimiento) {
      throw new ConsentimientoNoDisponibleException();
    }

    const lineaBase = LineaBase.crear(idUsuario, input.lineaBase);

    await this.registroRepository.completarConsentimientoYLineaBase(
      idUsuario,
      consentimiento.id,
      lineaBase,
    );

    return {
      estadoRegistro: EstadoRegistro.PENDIENTE_REVISION,
      siguientePaso: obtenerSiguientePaso(EstadoRegistro.PENDIENTE_REVISION),
      mensaje: 'Consentimiento y línea base registrados correctamente.',
    };
  }
}
