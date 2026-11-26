import { ArbolConversacional } from '../../domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { FlujoConversacionalDtoResponse } from './arbol-conversacional.dto-response';

export class ListadoFlujosDtoResponse {
  data!: { items: FlujoConversacionalDtoResponse[] };
  meta!: { page: number; page_size: number; total: number };

  static crear(
    flujos: FlujoConversacional[],
    total: number,
    page: number,
    pageSize: number,
  ): ListadoFlujosDtoResponse {
    return {
      data: {
        items: flujos.map((flujo) =>
          FlujoConversacionalDtoResponse.crear(flujo),
        ),
      },
      meta: { page, page_size: pageSize, total },
    };
  }
}

/** Resultado de clonar: el flujo nuevo y cuánto se copió desde `id_flujo_origen`. */
export class ClonacionFlujoDtoResponse {
  flujo!: FlujoConversacionalDtoResponse;
  id_flujo_origen!: string;
  nodos_copiados!: number;
  transiciones_copiadas!: number;

  static crear(
    clon: ArbolConversacional,
    idFlujoOrigen: string,
  ): ClonacionFlujoDtoResponse {
    return {
      flujo: FlujoConversacionalDtoResponse.crear(clon.flujo),
      id_flujo_origen: idFlujoOrigen,
      nodos_copiados: clon.nodos.length,
      transiciones_copiadas: clon.transiciones.length,
    };
  }
}

/** Respuesta histórica de nueva versión: únicamente el flujo creado. */
export class NuevaVersionFlujoDtoResponse {
  static desde(
    clonacion: ClonacionFlujoDtoResponse,
  ): FlujoConversacionalDtoResponse {
    return clonacion.flujo;
  }
}

export class VersionClonadaDtoResponse {
  id_flujo!: string;
  id_flujo_origen!: string;
  version!: number;
  estado!: EstadoFlujoConversacional;
  nodos_copiados!: number;
  transiciones_copiadas!: number;

  static desde(
    clonacion: ClonacionFlujoDtoResponse,
  ): VersionClonadaDtoResponse {
    return {
      id_flujo: clonacion.flujo.id_flujo,
      id_flujo_origen: clonacion.id_flujo_origen,
      version: clonacion.flujo.version,
      estado: clonacion.flujo.estado,
      nodos_copiados: clonacion.nodos_copiados,
      transiciones_copiadas: clonacion.transiciones_copiadas,
    };
  }
}

export class FlujoPublicadoDtoResponse {
  id_flujo!: string;
  estado!: EstadoFlujoConversacional;
  version!: number;
  fecha_publicacion!: Date | null;

  static desde(
    flujo: FlujoConversacionalDtoResponse,
  ): FlujoPublicadoDtoResponse {
    return {
      id_flujo: flujo.id_flujo,
      estado: flujo.estado,
      version: flujo.version,
      fecha_publicacion: flujo.fecha_publicacion,
    };
  }
}

export class FlujoArchivadoDtoResponse {
  id_flujo!: string;
  estado!: EstadoFlujoConversacional;
  fecha_archivado!: Date | null;

  static desde(
    flujo: FlujoConversacionalDtoResponse,
  ): FlujoArchivadoDtoResponse {
    return {
      id_flujo: flujo.id_flujo,
      estado: flujo.estado,
      fecha_archivado: flujo.fecha_archivado,
    };
  }
}
