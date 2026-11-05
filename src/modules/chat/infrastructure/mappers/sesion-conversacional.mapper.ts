import { Prisma } from '@prisma/client';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

/** Fila de la sesión junto con su estado. */
export type SesionConEstadoFila = Prisma.chat_sesionesGetPayload<{
  include: { estado_sesiones: true };
}>;

export class SesionConversacionalMapper {
  static toDomain(fila: SesionConEstadoFila): SesionConversacional {
    if (fila.estado_sesiones === null) {
      throw new Error('La sesión no tiene un estado registrado.');
    }

    return new SesionConversacional(
      fila.id_sesion,
      fila.id_usuario,
      fila.id_flujo_conversacional,
      fila.version_arbol_utilizada,
      fila.modalidad_activa as ModalidadConversacional,
      fila.tipo_dependencia as TipoDependenciaClinica | null,
      fila.tipo_craving as TipoCravingClinico | null,
      fila.id_nodo_actual,
      fila.estado_sesiones.estado_actual,
      fila.fecha_inicio,
      fila.fecha_ultima_interaccion,
    );
  }

  /**
   * Datos para crear la sesión con su estado. Una sesión en ERROR_CONFIGURACION
   * no referencia flujo, versión ni nodo, por eso esas columnas se omiten.
   */
  static toCreateData(
    sesion: SesionConversacional,
  ): Prisma.chat_sesionesUncheckedCreateInput {
    return {
      id_sesion: sesion.idSesion,
      id_usuario: sesion.idUsuario,
      ...(sesion.idFlujoConversacional !== null && {
        id_flujo_conversacional: sesion.idFlujoConversacional,
      }),
      ...(sesion.versionArbolUtilizada !== null && {
        version_arbol_utilizada: sesion.versionArbolUtilizada,
      }),
      modalidad_activa: sesion.modalidadActiva,
      tipo_dependencia: sesion.tipoDependencia,
      tipo_craving: sesion.tipoCraving,
      ...(sesion.idNodoActual !== null && {
        id_nodo_actual: sesion.idNodoActual,
      }),
      fecha_inicio: sesion.fechaInicio,
      fecha_ultima_interaccion: sesion.fechaUltimaInteraccion,
      estado_sesiones: { create: { estado_actual: sesion.estadoActual } },
    };
  }

  /** Datos que se actualizan en una sesión con avance (nodo e interacción). */
  static toProgressUpdateData(
    sesion: SesionConversacional,
  ): Prisma.chat_sesionesUncheckedUpdateInput {
    return {
      id_nodo_actual: sesion.idNodoActual,
      fecha_ultima_interaccion: sesion.fechaUltimaInteraccion,
    };
  }

  /** Datos que se actualizan al repetir un intento fallido de configuración. */
  static toErrorUpdateData(
    sesion: SesionConversacional,
  ): Prisma.chat_sesionesUncheckedUpdateInput {
    return {
      modalidad_activa: sesion.modalidadActiva,
      tipo_dependencia: sesion.tipoDependencia,
      tipo_craving: sesion.tipoCraving,
      fecha_ultima_interaccion: sesion.fechaUltimaInteraccion,
    };
  }
}
