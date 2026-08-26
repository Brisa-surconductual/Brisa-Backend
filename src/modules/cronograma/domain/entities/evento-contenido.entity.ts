import { EstadoContenido } from '../enums/estado-contenido.enum';
import { CambioEstadoContenidoInvalidoException } from '../exeption/cambio-estado-contenido-invalido.exception';
import { DatosEventoContenidoInvalidosException } from '../exeption/datos-evento-contenido-invalidos.exception';
import { TransicionEstadoContenido } from './contenido-estado-pendiente.entity';

export const TIPO_EVENTO_CAMBIO_ESTADO_CONTENIDO =
  'cronograma.contenido.estado-cambiado';
export const VERSION_EVENTO_CONTENIDO = '1.0';

export interface ModuloDestinoEvento {
  readonly id_modulo: string;
  readonly codigo_modulo: string;
  readonly nombre_modulo: string;
}

export interface DatosContenidoEvento {
  readonly id_contenido_cronograma: string;
  readonly id_contenido: string;
  readonly id_cronograma: string;
}

export interface EventoContenidoPayloadV1 {
  readonly tipo_evento: typeof TIPO_EVENTO_CAMBIO_ESTADO_CONTENIDO;
  readonly version: typeof VERSION_EVENTO_CONTENIDO;
  readonly id_contenido_cronograma: string;
  readonly id_contenido: string;
  readonly id_cronograma: string;
  readonly estado_anterior?: EstadoContenido;
  readonly estado_nuevo: EstadoContenido;
  readonly fecha_cambio: string;
  readonly modulos_destino: readonly ModuloDestinoEvento[];
}

export class EventoContenido {
  private constructor(
    readonly id_evento: bigint | null,
    readonly id_contenido_cronograma: string,
    readonly id_cronograma: string,
    readonly estado_anterior: EstadoContenido | null,
    readonly estado_nuevo: EstadoContenido,
    readonly fecha_cambio: Date,
    readonly version_evento: string,
    readonly payload: EventoContenidoPayloadV1,
  ) {}

  static crear(
    contenido: DatosContenidoEvento,
    transicion: TransicionEstadoContenido,
    modulosDestino: readonly ModuloDestinoEvento[],
    fechaCambio: Date,
  ): EventoContenido {
    if (!this.esTransicionValida(transicion)) {
      throw new CambioEstadoContenidoInvalidoException();
    }

    const modulosUnicos = this.normalizarModulos(modulosDestino);
    const payload: EventoContenidoPayloadV1 = {
      tipo_evento: TIPO_EVENTO_CAMBIO_ESTADO_CONTENIDO,
      version: VERSION_EVENTO_CONTENIDO,
      id_contenido_cronograma: contenido.id_contenido_cronograma,
      id_contenido: contenido.id_contenido,
      id_cronograma: contenido.id_cronograma,
      ...(transicion.estado_anterior
        ? { estado_anterior: transicion.estado_anterior }
        : {}),
      estado_nuevo: transicion.estado_nuevo,
      fecha_cambio: fechaCambio.toISOString(),
      modulos_destino: modulosUnicos,
    };

    if (
      !contenido.id_contenido_cronograma ||
      !contenido.id_contenido ||
      !contenido.id_cronograma ||
      Number.isNaN(fechaCambio.getTime()) ||
      this.contieneNulos(payload)
    ) {
      throw new DatosEventoContenidoInvalidosException();
    }

    return new EventoContenido(
      null,
      contenido.id_contenido_cronograma,
      contenido.id_cronograma,
      transicion.estado_anterior,
      transicion.estado_nuevo,
      new Date(fechaCambio),
      VERSION_EVENTO_CONTENIDO,
      this.congelar(payload),
    );
  }

  marcarPersistido(idEvento: bigint): EventoContenido {
    return new EventoContenido(
      idEvento,
      this.id_contenido_cronograma,
      this.id_cronograma,
      this.estado_anterior,
      this.estado_nuevo,
      new Date(this.fecha_cambio),
      this.version_evento,
      this.payload,
    );
  }

  private static normalizarModulos(
    modulos: readonly ModuloDestinoEvento[],
  ): readonly ModuloDestinoEvento[] {
    const unicos = new Map<string, ModuloDestinoEvento>();

    for (const modulo of modulos) {
      if (!modulo.id_modulo || !modulo.codigo_modulo || !modulo.nombre_modulo) {
        throw new DatosEventoContenidoInvalidosException();
      }

      unicos.set(modulo.id_modulo, {
        id_modulo: modulo.id_modulo,
        codigo_modulo: modulo.codigo_modulo,
        nombre_modulo: modulo.nombre_modulo,
      });
    }

    return [...unicos.values()].sort((a, b) =>
      a.codigo_modulo.localeCompare(b.codigo_modulo),
    );
  }

  private static esTransicionValida(
    transicion: TransicionEstadoContenido,
  ): boolean {
    return (
      (transicion.estado_anterior === null &&
        transicion.estado_nuevo === EstadoContenido.PROGRAMADO) ||
      (transicion.estado_anterior === EstadoContenido.PROGRAMADO &&
        transicion.estado_nuevo === EstadoContenido.ACTIVO) ||
      (transicion.estado_anterior === EstadoContenido.ACTIVO &&
        transicion.estado_nuevo === EstadoContenido.FINALIZADO)
    );
  }

  private static contieneNulos(valor: unknown): boolean {
    if (valor === null || valor === undefined) {
      return true;
    }

    if (Array.isArray(valor)) {
      return valor.some((item) => this.contieneNulos(item));
    }

    if (typeof valor === 'object') {
      return Object.values(valor).some((item) => this.contieneNulos(item));
    }

    return false;
  }

  private static congelar<T>(valor: T): T {
    if (valor && typeof valor === 'object') {
      Object.freeze(valor);
      for (const hijo of Object.values(valor)) {
        this.congelar(hijo);
      }
    }

    return valor;
  }
}
