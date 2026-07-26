import {
  LineaBase,
  LineaBaseDatos,
} from '../../domain/entities/linea-bases.entity';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { EstadoRegistroInvalidoException } from '../../domain/exceptions/usuario.exceptions';
import { RegistroRepository } from '../../domain/repositories/registro.repository';
import { obtenerSiguientePaso } from '../services/siguiente-paso-registro';

export type ActualizarRevisionRegistroInput = Partial<LineaBaseDatos>;

const camposSensibles = new Set<keyof LineaBaseDatos>([
  'edad',
  'fechaInicioConsumo',
  'fechaUltimoConsumo',
  'motivoInicioConsumo',
  'frecuenciaConsumo',
]);

function sonIguales(
  actual: LineaBaseDatos[keyof LineaBaseDatos],
  nuevo: LineaBaseDatos[keyof LineaBaseDatos],
): boolean {
  if (actual instanceof Date && nuevo instanceof Date) {
    return actual.getTime() === nuevo.getTime();
  }
  return actual === nuevo;
}

export class ActualizarRevisionRegistroUseCase {
  constructor(private readonly registroRepository: RegistroRepository) {}

  async execute(idUsuario: string, input: ActualizarRevisionRegistroInput) {
    const revision = await this.registroRepository.obtenerRevision(idUsuario);
    if (!revision) {
      throw new EstadoRegistroInvalidoException();
    }
    if (revision.estadoRegistro === EstadoRegistro.REGISTRO_COMPLETO) {
      throw new EstadoRegistroInvalidoException(
        'El registro ya fue confirmado y no puede modificarse desde este flujo.',
      );
    }

    const actuales = revision.lineaBase.toDatos();
    const actualizados: LineaBaseDatos = { ...actuales };
    const modificados: (keyof LineaBaseDatos)[] = [];

    for (const key of Object.keys(input) as (keyof LineaBaseDatos)[]) {
      const value = input[key];
      if (value !== undefined && !sonIguales(actuales[key], value)) {
        Object.assign(actualizados, { [key]: value });
        modificados.push(key);
      }
    }

    if (modificados.length === 0) {
      return {
        camposModificados: [],
        requiereNuevoConsentimiento: !revision.consentimientoVigente,
        estadoRegistro: revision.estadoRegistro,
        siguientePaso: obtenerSiguientePaso(revision.estadoRegistro),
      };
    }

    // Reconstituting validates every merged field before persistence.
    LineaBase.reconstituir({
      ...actualizados,
      id: revision.lineaBase.getId(),
      idUsuario: revision.lineaBase.getUsuarioId(),
      fechaCreacion: revision.lineaBase.getFechaCreacion(),
      fechaActualizacion: new Date(),
    });

    const invalidaConsentimiento = modificados.some((campo) =>
      camposSensibles.has(campo),
    );

    await this.registroRepository.actualizarLineaBase(
      idUsuario,
      actualizados,
      modificados,
      invalidaConsentimiento,
    );

    const estadoRegistro = invalidaConsentimiento
      ? EstadoRegistro.PENDIENTE_CONSENTIMIENTO
      : revision.estadoRegistro;

    return {
      camposModificados: modificados,
      requiereNuevoConsentimiento: invalidaConsentimiento,
      estadoRegistro,
      siguientePaso: obtenerSiguientePaso(estadoRegistro),
      mensaje: invalidaConsentimiento
        ? 'Los cambios requieren una nueva aceptación del consentimiento.'
        : 'Datos actualizados correctamente.',
    };
  }
}
