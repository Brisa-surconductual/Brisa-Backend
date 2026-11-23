import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  ActorAuditoria,
  AuditoriaAdministrativaPort,
  DetalleAuditoria,
  EventoAuditoriaAdministrativa,
} from '../../../../shared/application/ports/auditoria-administrativa.port';
import { normalizarCodigoParticipante } from '../../domain/policies/codigo-participante.policy';
import { SesionConversacionalRepository } from '../../domain/repositories/sesion-conversacional.repository';
import { SeudonimoParticipantePort } from '../ports/seudonimo-participante.port';

/** Consultas administrativas de RF-38 que se auditan (RF-123). */
export enum OperacionConsultaTrazabilidad {
  LISTAR_SESIONES_PARTICIPANTE = 'LISTAR_SESIONES_PARTICIPANTE',
  CONSULTAR_TRAZABILIDAD_SESION = 'CONSULTAR_TRAZABILIDAD_SESION',
}

const RECURSO: Record<OperacionConsultaTrazabilidad, string> = {
  [OperacionConsultaTrazabilidad.LISTAR_SESIONES_PARTICIPANTE]:
    'sesiones_participante_chat',
  [OperacionConsultaTrazabilidad.CONSULTAR_TRAZABILIDAD_SESION]:
    'trazabilidad_sesion_chat',
};

/**
 * Datos de la petición tal como llegan (sin validar). Solo se usan si tienen
 * un formato válido; nunca se copian al detalle de la bitácora.
 */
export interface ConsultaTrazabilidadAuditada {
  operacion: OperacionConsultaTrazabilidad;
  actor: ActorAuditoria;
  /** Parámetro de ruta :codigo_participante del listado. */
  codigoParticipante?: unknown;
  /** Parámetro de ruta :id_sesion (sesión CONVERSACIONAL consultada). */
  idSesionConversacional?: unknown;
}

/** Resultado no exitoso, ya clasificado por la capa HTTP. */
export interface ResultadoNoExitoso {
  estadoHttp: number;
  /** Código público del catálogo, o null. Nunca un mensaje. */
  codigo: string | null;
}

/**
 * RF-123 para las consultas de RF-38: arma el evento CONSULTA_PARTICIPANTE y
 * lo registra. Separado de la lógica de consulta (RNF de mantenibilidad de
 * RF-123). No registra preguntas, respuestas ni contenido de los nodos.
 */
@Injectable()
export class AuditarConsultaTrazabilidadService {
  constructor(
    private readonly auditoria: AuditoriaAdministrativaPort,
    private readonly sesiones: SesionConversacionalRepository,
    private readonly seudonimos: SeudonimoParticipantePort,
  ) {}

  /**
   * Consulta EXITOSA. Obligatoria: si no se puede registrar (incluido no poder
   * identificar al participante consultado), lanza y la consulta no se entrega.
   */
  async registrarExitosa(
    consulta: ConsultaTrazabilidadAuditada,
  ): Promise<void> {
    const idParticipante = await this.participante(consulta);
    if (idParticipante === null)
      throw new Error('No se pudo identificar al participante consultado.');
    await this.auditoria.registrar(
      this.evento(consulta, 'EXITOSA', idParticipante, {}),
    );
  }

  /**
   * Consulta FALLIDA o DENEGADA. La respuesta ya es un error sin datos, así
   * que el registro es de mejor esfuerzo: devuelve false si no se pudo.
   * Una consulta DENEGADA no resuelve el participante: quien no está
   * autorizado no provoca lecturas de datos de participantes.
   */
  async registrarNoExitosa(
    consulta: ConsultaTrazabilidadAuditada,
    estado: 'FALLIDA' | 'DENEGADA',
    resultado: ResultadoNoExitoso,
  ): Promise<boolean> {
    try {
      const idParticipante =
        estado === 'DENEGADA'
          ? null
          : await this.participante(consulta).catch(() => null);
      await this.auditoria.registrar(
        this.evento(consulta, estado, idParticipante, {
          estado_http: resultado.estadoHttp,
          codigo_resultado: resultado.codigo,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private evento(
    consulta: ConsultaTrazabilidadAuditada,
    estado: EventoAuditoriaAdministrativa['estado'],
    idParticipante: string | null,
    adicional: DetalleAuditoria,
  ): EventoAuditoriaAdministrativa {
    return {
      actor: consulta.actor,
      accion: 'CONSULTA_PARTICIPANTE',
      recursoAfectado: RECURSO[consulta.operacion],
      idRecurso: idSesionValida(consulta),
      idParticipante,
      estado,
      detalle: { operacion: consulta.operacion, ...adicional },
    };
  }

  /** id_usuario del participante consultado, o null si no se identifica. */
  private async participante(
    consulta: ConsultaTrazabilidadAuditada,
  ): Promise<string | null> {
    if (
      consulta.operacion ===
      OperacionConsultaTrazabilidad.LISTAR_SESIONES_PARTICIPANTE
    ) {
      const codigo = normalizarCodigoParticipante(consulta.codigoParticipante);
      return codigo === null ? null : this.seudonimos.resolver(codigo);
    }
    const idSesion = idSesionValida(consulta);
    if (idSesion === null) return null;
    return (await this.sesiones.buscarPorId(idSesion))?.idUsuario ?? null;
  }
}

function idSesionValida(consulta: ConsultaTrazabilidadAuditada): string | null {
  if (
    consulta.operacion !==
    OperacionConsultaTrazabilidad.CONSULTAR_TRAZABILIDAD_SESION
  )
    return null;
  const valor = consulta.idSesionConversacional;
  return typeof valor === 'string' && isUUID(valor)
    ? valor.toLowerCase()
    : null;
}
