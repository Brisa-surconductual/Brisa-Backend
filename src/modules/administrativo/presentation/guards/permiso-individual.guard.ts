import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { AuditoriaService } from '../../application/services/auditoria.service';
import {
  type ParticipanteConsultado,
  VerificarPermisoIndividualUseCase,
} from '../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { AccionAdministrativa } from '../../domain/enums/accion-administrativa.enum';
import type { AlcancePermiso } from '../../domain/enums/alcance-permiso.enum';
import { EstadoAccion } from '../../domain/enums/estado-accion.enum';
import { RecursoAuditado } from '../../domain/enums/recurso-auditado.enum';
import { SeveridadAuditoria } from '../../domain/enums/severidad-auditoria.enum';
import { contextoAuditoria } from '../http/contexto-auditoria';

export const ALCANCE_PERMISO_KEY = 'alcance_permiso_individual';
export const MENSAJE_PERMISO_KEY = 'mensaje_permiso_individual';
export const CODIGO_PERMISO_KEY = 'codigo_permiso_individual';

/** Mensaje de RF-03 para el acceso individual sin consentimiento explícito. */
export const MENSAJE_SIN_PERMISO_INDIVIDUAL =
  'No tiene autorización para consultar información individual del usuario.';

export const CODIGO_SIN_PERMISO_INDIVIDUAL = 'SIN_PERMISO_INDIVIDUAL';

/** 403 estándar del guard: `{ status, codigo, mensaje }`. */
export function sinPermisoIndividual(
  mensaje: string = MENSAJE_SIN_PERMISO_INDIVIDUAL,
  codigo: string = CODIGO_SIN_PERMISO_INDIVIDUAL,
): ForbiddenException {
  return new ForbiddenException({ status: 403, codigo, mensaje });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const SESION_MAL_FORMADA = Symbol('sesion-mal-formada');

const texto = (valor: unknown): string | null =>
  typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;

/**
 * RF-04 / RF-145: protege las consultas de datos individuales de un participante.
 *
 * Debe ejecutarse después de SessionAuthGuard y RolesGuard. COORDINADOR_PSI pasa
 * sin permiso (es quien los otorga y supervisa). ADMINISTRATIVO necesita un
 * permiso vigente con el alcance declarado. Cualquier otro rol se rechaza.
 */
@Injectable()
export class PermisoIndividualGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verificar: VerificarPermisoIndividualUseCase,
    private readonly auditoria: AuditoriaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const alcance = this.reflector.getAllAndOverride<AlcancePermiso>(
      ALCANCE_PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );
    const mensaje = this.reflector.getAllAndOverride<string | undefined>(
      MENSAJE_PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );
    const codigo = this.reflector.getAllAndOverride<string | undefined>(
      CODIGO_PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedSessionRequest>();
    const usuario = request.autenticacion?.usuario;
    if (!usuario) throw sinPermisoIndividual(mensaje, codigo);

    const rol = usuario.rol;
    if (rol === Rol.COORDINADOR_PSI) return true;

    const participante = this.participanteDe(request);
    // id_sesion mal formado: lo rechaza ParseUUIDPipe con 400 sin consultar datos.
    if (participante === SESION_MAL_FORMADA) return true;
    const autorizado =
      rol === Rol.ADMINISTRATIVO &&
      participante !== null &&
      (await this.verificar.execute(usuario.id_usuario, participante, alcance));
    if (autorizado) return true;

    await this.auditoria.registrarIntento(
      contextoAuditoria(request),
      {
        accion: AccionAdministrativa.INTENTO_ACCESO_NO_AUTORIZADO,
        recurso: RecursoAuditado.PERMISO_INDIVIDUAL,
        severidad: SeveridadAuditoria.ALTA,
        detalle: {
          motivo: 'SIN_PERMISO_INDIVIDUAL_VIGENTE',
          alcance,
          uri: request.path,
        },
      },
      EstadoAccion.DENEGADA,
    );
    throw sinPermisoIndividual(mensaje, codigo);
  }

  /** params > query > body; si la ruta solo trae la sesión de chat, se usa esa. */
  private participanteDe(
    request: AuthenticatedSessionRequest,
  ): ParticipanteConsultado | typeof SESION_MAL_FORMADA | null {
    const params = (request.params ?? {}) as Record<string, unknown>;
    const query = (request.query ?? {}) as Record<string, unknown>;
    const body = (request.body ?? {}) as Record<string, unknown>;
    const codigo =
      texto(params.codigo_participante) ??
      texto(params.id_participante) ??
      texto(query.codigo_participante) ??
      texto(body.codigo_participante);
    if (codigo) return { codigo: codigo.toUpperCase() };
    const idSesion = texto(params.id_sesion);
    if (!idSesion) return null;
    return UUID.test(idSesion) ? { idSesion } : SESION_MAL_FORMADA;
  }
}
