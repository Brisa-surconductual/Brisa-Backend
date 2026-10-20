import { EstadoFlujoConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { VersionClonada } from '../../domain/repositories/arbol-conversacional.repository';
import { FlujoConversacionalDtoResponse } from './arbol-conversacional.dto-response';

export interface ListadoFlujosDtoResponse {
  data: { items: FlujoConversacionalDtoResponse[] };
  meta: { page: number; page_size: number; total: number };
}

export class VersionClonadaDtoResponse {
  id_flujo!: string;
  id_flujo_origen!: string;
  version!: number;
  estado!: EstadoFlujoConversacional;
  nodos_copiados!: number;
  transiciones_copiadas!: number;

  static crear(resultado: VersionClonada): VersionClonadaDtoResponse {
    return {
      id_flujo: resultado.flujo.idFlujo,
      id_flujo_origen: resultado.idFlujoOrigen,
      version: resultado.flujo.version,
      estado: resultado.flujo.estado,
      nodos_copiados: resultado.nodosCopiados,
      transiciones_copiadas: resultado.transicionesCopiadas,
    };
  }
}

export interface FlujoPublicadoDtoResponse {
  id_flujo: string;
  estado: EstadoFlujoConversacional;
  version: number;
  fecha_publicacion: Date | null;
}

export interface FlujoArchivadoDtoResponse {
  id_flujo: string;
  estado: EstadoFlujoConversacional;
  fecha_archivado: Date | null;
}
