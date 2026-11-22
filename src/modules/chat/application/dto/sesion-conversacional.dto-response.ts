import { UbicacionTemporalUsuarioDtoResponse } from '../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { HistorialInteraccionesDtoResponse } from './historial-interacciones.dto-response';
import { PresentacionNodoActualDtoResponse } from './presentacion-nodo-actual.dto-response';

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
  ultima_secuencia!: number;
}

export class NodoActualDtoResponse {
  id_nodo!: string;
  tipo_nodo!: string;
  es_terminal!: boolean;
  disponibilidad!: { habilitado: boolean; habilita_aprox: string | null };
  bloques!: PresentacionNodoActualDtoResponse['nodo']['bloques'];
  entrada!: PresentacionNodoActualDtoResponse['nodo']['entrada'];

  static desde(
    nodo: PresentacionNodoActualDtoResponse['nodo'],
  ): NodoActualDtoResponse {
    return {
      id_nodo: nodo.idNodo,
      tipo_nodo: nodo.tipoNodo,
      es_terminal: nodo.esTerminal,
      disponibilidad: {
        habilitado: nodo.disponibilidad.habilitado,
        habilita_aprox: nodo.disponibilidad.habilitaAprox,
      },
      bloques: nodo.bloques,
      entrada: nodo.entrada,
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
  recuperada_desde_historial!: boolean;
  sesion!: SesionConversacionalDtoResponse;
  nodo_actual!: NodoActualDtoResponse;
  historial_reciente!: HistorialInteraccionesDtoResponse['data'];
  ubicacion_temporal!: UbicacionTemporalSesionDtoResponse;

  static crear(
    sesion: SesionConversacional,
    nodo: PresentacionNodoActualDtoResponse['nodo'],
    historial: HistorialInteraccionesDtoResponse['data'],
    ubicacion: UbicacionTemporalUsuarioDtoResponse,
    estado: { reanudada: boolean; recuperadaDesdeHistorial: boolean },
  ): InicioSesionConversacionalDtoResponse {
    return {
      reanudada: estado.reanudada,
      recuperada_desde_historial: estado.recuperadaDesdeHistorial,
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
        ultima_secuencia: historial.items.at(-1)?.secuencia ?? 0,
      },
      nodo_actual: NodoActualDtoResponse.desde(nodo),
      historial_reciente: historial,
      ubicacion_temporal: {
        id_unidad_temporal: ubicacion.id_unidad_temporal,
        nombre_unidad: ubicacion.nombre_unidad,
        finalizado_programa: ubicacion.cronograma_finalizado,
      },
    };
  }
}
