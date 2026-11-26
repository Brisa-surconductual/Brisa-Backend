import { AuditoriaArbolConversacional } from '../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { FlujoConversacionalDtoResponse } from './arbol-conversacional.dto-response';

export class PerfilArbolDtoResponse {
  tipo_dependencia!: TipoDependenciaClinica;
  tipo_craving!: TipoCravingClinico;
  publicado!: FlujoConversacionalDtoResponse | null;
  versiones!: FlujoConversacionalDtoResponse[];
}

export class HistorialArbolesPersonalizadosDtoResponse {
  combinaciones!: PerfilArbolDtoResponse[];

  /** Siempre entrega las cuatro combinaciones de perfil, con su historial. */
  static crear(
    flujos: FlujoConversacional[],
  ): HistorialArbolesPersonalizadosDtoResponse {
    return {
      combinaciones: Object.values(TipoDependenciaClinica).flatMap(
        (tipoDependencia) =>
          Object.values(TipoCravingClinico).map((tipoCraving) => {
            const versiones = flujos
              .filter(
                (flujo) =>
                  flujo.tipoDependencia === tipoDependencia &&
                  flujo.tipoCraving === tipoCraving,
              )
              .map((flujo) => FlujoConversacionalDtoResponse.crear(flujo));
            return {
              tipo_dependencia: tipoDependencia,
              tipo_craving: tipoCraving,
              publicado:
                versiones.find(
                  (flujo) =>
                    flujo.estado === EstadoFlujoConversacional.PUBLICADO,
                ) ?? null,
              versiones,
            };
          }),
      ),
    };
  }
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
