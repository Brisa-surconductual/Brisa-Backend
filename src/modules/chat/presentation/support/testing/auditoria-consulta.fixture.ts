import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { EventoAuditoriaAdministrativa } from '../../../../../shared/application/ports/auditoria-administrativa.port';
import { SeudonimoParticipantePort } from '../../../application/ports/seudonimo-participante.port';
import { AuditarConsultaTrazabilidadService } from '../../../application/services/auditar-consulta-trazabilidad.service';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';

/** Usuario y sesión de AUTENTICACIÓN simulados (no la sesión conversacional). */
export const ID_USUARIO_ADMIN = '00000000-0000-4000-8000-0000000000ad';
export const ID_SESION_AUTENTICACION = '00000000-0000-4000-8000-0000000a0701';
export const ID_PARTICIPANTE = '00000000-0000-4000-8000-000000000002';

/**
 * SessionAuthGuard simulado. Cabeceras: x-test-auth=ausente (401),
 * x-test-role, x-test-alcance y x-test-sesion-auth=ausente (sin id de la
 * sesión de autenticación).
 */
export const autenticarPrueba = (c: ExecutionContext): boolean => {
  const req = c.switchToHttp().getRequest<{
    headers: Record<string, string>;
    autenticacion?: unknown;
  }>();
  if (req.headers['x-test-auth'] === 'ausente')
    throw new UnauthorizedException();
  req.autenticacion = {
    usuario: {
      id_usuario: ID_USUARIO_ADMIN,
      rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
    },
    sesion: {
      id_sesion:
        req.headers['x-test-sesion-auth'] === 'ausente'
          ? undefined
          : ID_SESION_AUTENTICACION,
      alcance_sesion: req.headers['x-test-alcance'] ?? 'COMPLETA',
      csrf_token_hash: 'hash',
    },
  };
  return true;
};

/** Bitácora simulada con el servicio de auditoría real. */
export function auditoriaPrueba() {
  const registrar = jest.fn<Promise<string>, [EventoAuditoriaAdministrativa]>();
  const buscarPorId = jest.fn<
    Promise<{ idUsuario: string } | null>,
    [string]
  >();
  const resolver = jest.fn<Promise<string | null>, [string]>();
  const reiniciar = () => {
    registrar.mockReset().mockResolvedValue('id-auditoria');
    buscarPorId.mockReset().mockResolvedValue({ idUsuario: ID_PARTICIPANTE });
    resolver.mockReset().mockResolvedValue(ID_PARTICIPANTE);
  };
  reiniciar();
  const servicio = new AuditarConsultaTrazabilidadService(
    { registrar },
    { buscarPorId } as unknown as SesionConversacionalRepository,
    { resolver } as unknown as SeudonimoParticipantePort,
  );
  return {
    registrar,
    buscarPorId,
    resolver,
    reiniciar,
    provider: {
      provide: AuditarConsultaTrazabilidadService,
      useValue: servicio,
    },
    /** Eventos registrados en esta prueba. */
    eventos: () => registrar.mock.calls.map(([evento]) => evento),
  };
}
