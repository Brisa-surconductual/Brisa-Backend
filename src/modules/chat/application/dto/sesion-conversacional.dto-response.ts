import { UbicacionTemporalUsuarioDtoResponse } from '../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';

export class PerfilClinicoContextoDtoResponse {
  tipo_dependencia!: TipoDependenciaClinica;
  tipo_craving!: TipoCravingClinico;
}

/** Resultado de RF-24B: modalidad activa y, si aplica, el perfil clínico. */
export class ContextoConversacionalDtoResponse {
  modalidad!: ModalidadConversacional;
  perfil!: PerfilClinicoContextoDtoResponse | null;

  static grupal(): ContextoConversacionalDtoResponse {
    return { modalidad: ModalidadConversacional.GRUPAL, perfil: null };
  }

  static personalizado(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): ContextoConversacionalDtoResponse {
    return {
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: { tipo_dependencia: tipoDependencia, tipo_craving: tipoCraving },
    };
  }
}

export class SesionConversacionalDtoResponse {
  id_sesion!: string;
  id_flujo_conversacional!: string | null;
  version_arbol_utilizada!: number | null;
  modalidad_activa!: SesionConversacional['modalidadActiva'];
  tipo_dependencia!: SesionConversacional['tipoDependencia'];
  tipo_craving!: SesionConversacional['tipoCraving'];
  estado_actual!: SesionConversacional['estadoActual'];
  fecha_inicio!: Date;
  fecha_ultima_interaccion!: Date;
}

export class NodoActualDtoResponse {
  id_nodo!: string;
  tipo_nodo!: string;
  contenido!: Record<string, unknown>;
  es_nodo_inicial!: boolean;
  orden!: number | null;

  static desde(nodo: NodoConversacional): NodoActualDtoResponse {
    return {
      id_nodo: nodo.idNodo,
      tipo_nodo: nodo.nombreTipoNodo,
      contenido: nodo.contenido,
      es_nodo_inicial: nodo.esNodoInicial,
      orden: nodo.orden,
    };
  }
}

export class UbicacionTemporalSesionDtoResponse {
  id_unidad_temporal!: string | null;
  nombre_unidad!: string | null;
  finalizado_programa!: boolean;
}

/** Resultado de RF-24: sesión preparada y nodo en el que queda posicionada. */
export class InicioSesionConversacionalDtoResponse {
  reanudada!: boolean;
  sesion!: SesionConversacionalDtoResponse;
  nodo_actual!: NodoActualDtoResponse;
  ubicacion_temporal!: UbicacionTemporalSesionDtoResponse;

  static crear(
    sesion: SesionConversacional,
    nodo: NodoConversacional,
    reanudada: boolean,
    ubicacion: UbicacionTemporalUsuarioDtoResponse,
  ): InicioSesionConversacionalDtoResponse {
    return {
      reanudada,
      sesion: {
        id_sesion: sesion.idSesion,
        id_flujo_conversacional: sesion.idFlujoConversacional,
        version_arbol_utilizada: sesion.versionArbolUtilizada,
        modalidad_activa: sesion.modalidadActiva,
        tipo_dependencia: sesion.tipoDependencia,
        tipo_craving: sesion.tipoCraving,
        estado_actual: sesion.estadoActual,
        fecha_inicio: sesion.fechaInicio,
        fecha_ultima_interaccion: sesion.fechaUltimaInteraccion,
      },
      nodo_actual: NodoActualDtoResponse.desde(nodo),
      ubicacion_temporal: {
        id_unidad_temporal: ubicacion.id_unidad_temporal,
        nombre_unidad: ubicacion.nombre_unidad,
        finalizado_programa: ubicacion.cronograma_finalizado,
      },
    };
  }
}
