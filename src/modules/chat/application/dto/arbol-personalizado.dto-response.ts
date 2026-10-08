import { AuditoriaArbolConversacional } from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import { FlujoConversacionalDtoResponse } from './arbol-conversacional.dto-response';

export class PerfilArbolDtoResponse {
  tipo_dependencia!: TipoDependenciaClinica;
  tipo_craving!: TipoCravingClinico;
  publicado!: FlujoConversacionalDtoResponse | null;
  versiones!: FlujoConversacionalDtoResponse[];
}

export class HistorialArbolesPersonalizadosDtoResponse {
  combinaciones!: PerfilArbolDtoResponse[];
}

export class AuditoriaArbolDtoResponse {
  id_auditoria!: string;
  id_flujo!: string;
  id_actor!: string;
  accion!: string;
  id_objeto!: string | null;
  fecha_operacion!: Date;

  static crear(
    auditoria: AuditoriaArbolConversacional,
  ): AuditoriaArbolDtoResponse {
    return {
      id_auditoria: auditoria.idAuditoria.toString(),
      id_flujo: auditoria.idFlujo,
      id_actor: auditoria.idActor,
      accion: auditoria.accion,
      id_objeto: auditoria.idObjeto,
      fecha_operacion: auditoria.fechaOperacion,
    };
  }
}

export const ESTADOS_ARBOL_PERSONALIZADO = [
  EstadoFlujoConversacional.BORRADOR,
  EstadoFlujoConversacional.PUBLICADO,
  EstadoFlujoConversacional.ARCHIVADO,
] as const;
