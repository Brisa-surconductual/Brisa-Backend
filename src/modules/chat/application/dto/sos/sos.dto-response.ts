import {
  ContextoOrigenSos,
  IntervencionSos,
} from '../../../domain/entities/sos/intervencion-sos.entity';
import { EstadoIntervencionSos } from '../../../domain/enums/intervencion-sos.enum';
import { RecursoApoyo } from '../../ports/intervencion-sos.port';
import { fechaServidorBogota } from '../../support/fecha-servidor-bogota';
import { NodoActualDtoResponse } from '../sesion-conversacional.dto-response';

export class ContextoOrigenSosDtoResponse {
  modulo!: ContextoOrigenSos['modulo'];
  ruta!: string;
  estado!: Record<string, unknown> | null;

  static desde(
    contexto: ContextoOrigenSos | null,
  ): ContextoOrigenSosDtoResponse | null {
    return contexto === null
      ? null
      : {
          modulo: contexto.modulo,
          ruta: contexto.ruta,
          estado: contexto.estado,
        };
  }
}

/** RF-43: respuesta de POST /chat/sos/activar. */
export class ActivarSosDtoResponse {
  id_intervencion!: string;
  id_sesion_sos!: string;
  /** null si no había una sesión de terapia en curso. */
  sesion_pausada!: { id_sesion: string } | null;
  inicio_servidor!: string;
  fin_maximo_servidor!: string;
  nodo_actual!: NodoActualDtoResponse;
  recursos_apoyo!: RecursoApoyo[];
  /** Ampliación B. */
  contexto_origen!: ContextoOrigenSosDtoResponse | null;

  static crear(
    intervencion: IntervencionSos,
    nodo: NodoActualDtoResponse,
    recursos: RecursoApoyo[],
  ): ActivarSosDtoResponse {
    return {
      id_intervencion: intervencion.idIntervencion,
      id_sesion_sos: intervencion.idSesionSos,
      sesion_pausada:
        intervencion.idSesionPausada === null
          ? null
          : { id_sesion: intervencion.idSesionPausada },
      inicio_servidor: fechaServidorBogota(intervencion.inicioServidor),
      fin_maximo_servidor: fechaServidorBogota(intervencion.finMaximoServidor),
      nodo_actual: nodo,
      recursos_apoyo: recursos,
      contexto_origen: ContextoOrigenSosDtoResponse.desde(
        intervencion.contextoOrigen,
      ),
    };
  }
}

/** RF-43: respuesta de POST /chat/sos/{id_intervencion}/finalizar. */
export class FinalizarSosDtoResponse {
  duracion_segundos!: number;
  estado!: Exclude<EstadoIntervencionSos, EstadoIntervencionSos.EN_CURSO>;
  /** null si no había una sesión de terapia que retomar. */
  sesion_pausada!: { id_sesion: string; id_nodo_actual: string | null } | null;
  /** Ampliación B: a dónde vuelve el front. */
  contexto_retorno!: ContextoOrigenSosDtoResponse | null;

  static crear(
    intervencion: IntervencionSos,
    sesionPausada: { idSesion: string; idNodoActual: string | null } | null,
  ): FinalizarSosDtoResponse {
    return {
      duracion_segundos: intervencion.duracionSegundos ?? 0,
      estado: intervencion.estado as FinalizarSosDtoResponse['estado'],
      sesion_pausada:
        sesionPausada === null
          ? null
          : {
              id_sesion: sesionPausada.idSesion,
              id_nodo_actual: sesionPausada.idNodoActual,
            },
      contexto_retorno: ContextoOrigenSosDtoResponse.desde(
        intervencion.contextoOrigen,
      ),
    };
  }
}
