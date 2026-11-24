import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { actorAuditoria } from '../../../../shared/presentation/http/actor-auditoria';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import {
  ConsultaTrazabilidadAuditada,
  OperacionConsultaTrazabilidad,
  ResultadoNoExitoso,
} from '../../application/services/auditar-consulta-trazabilidad.service';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { esCodigoConversacional } from '../filters/catalogo-errores-conversacionales';
import { HTTP_ERRORES_DOMINIO } from '../filters/domain-exception.filter';

export const OPERACION_AUDITADA_KEY = 'chat:operacion-auditada';

/** Mensaje interno de RF-123 (flujo alterno «Fallo en registro de auditoría»). */
export const MENSAJE_FALLO_AUDITORIA =
  'No fue posible registrar la acción en la bitácora de auditoría.';

/**
 * Consulta auditable de la petición actual, o null si falta el actor (sin
 * usuario, sesión de autenticación o IP) o la operación no está declarada.
 */
export function consultaAuditada(
  reflector: Reflector,
  contexto: ExecutionContext,
): ConsultaTrazabilidadAuditada | null {
  const operacion = reflector.getAllAndOverride<
    OperacionConsultaTrazabilidad | undefined
  >(OPERACION_AUDITADA_KEY, [contexto.getHandler(), contexto.getClass()]);
  const solicitud = contexto
    .switchToHttp()
    .getRequest<AuthenticatedSessionRequest>();
  const actor = actorAuditoria(solicitud);
  if (operacion === undefined || actor === null) return null;
  const parametros = (solicitud.params ?? {}) as Record<string, unknown>;
  return {
    operacion,
    actor,
    codigoParticipante: parametros.codigo_participante,
    // :id_sesion de estas rutas es la sesión CONVERSACIONAL consultada; la de
    // autenticación del administrativo va en actor.idSesionAutenticacion.
    idSesionConversacional: parametros.id_sesion,
  };
}

/**
 * Estado HTTP y código público del error, con la misma clasificación que el
 * filtro conversacional. Nunca guarda mensajes: los de validación pueden
 * repetir nombres de parámetros enviados por el cliente.
 */
export function resultadoDeError(error: unknown): ResultadoNoExitoso {
  const estado =
    error instanceof DomainException
      ? HTTP_ERRORES_DOMINIO[error.tipo].statusCode
      : error instanceof HttpException
        ? error.getStatus()
        : 500;
  const cuerpo = error instanceof HttpException ? error.getResponse() : null;
  const codigo =
    error instanceof DomainException
      ? error.codigo
      : typeof cuerpo === 'object' && cuerpo !== null
        ? (cuerpo as { codigo?: unknown }).codigo
        : undefined;
  return {
    estadoHttp: estado >= 400 && estado <= 599 ? estado : 500,
    codigo: esCodigoConversacional(codigo) ? codigo : null,
  };
}
