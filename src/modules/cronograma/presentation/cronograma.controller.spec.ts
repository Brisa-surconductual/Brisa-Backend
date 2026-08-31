import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { TipoContenido } from '../domain/enums/tipo-contenido.enum';
import { TipoRecurso } from '../domain/enums/tipo-recurso.enum';
import { CronogramaController } from './cronograma.controller';

describe('CronogramaController - contenido psicoeducativo (RF-152)', () => {
  const crearUnidadTemporalUseCase = { execute: jest.fn() };
  const crearContenidoUseCase = { execute: jest.fn() };
  const actualizarContenidoUseCase = { execute: jest.fn() };
  const eliminarContenidoUseCase = { execute: jest.fn() };
  const crearRecursoContenidoUseCase = { execute: jest.fn() };
  const idContenido = '00000000-0000-4000-8000-000000000001';
  let controller: CronogramaController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CronogramaController(
      crearUnidadTemporalUseCase as never,
      crearContenidoUseCase as never,
      actualizarContenidoUseCase as never,
      eliminarContenidoUseCase as never,
      crearRecursoContenidoUseCase as never,
    );
  });

  it('delega la creación con los campos definidos por RF-152', async () => {
    const dto = {
      nombre_contenido: 'Prevención',
      tipo_contenido: TipoContenido.INFORMATIVO,
    };
    crearContenidoUseCase.execute.mockResolvedValue({
      id_contenido: idContenido,
    });

    await controller.crearContenido(dto);

    expect(crearContenidoUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delega la actualización usando el identificador de la ruta', async () => {
    const dto = { tipo_contenido: TipoContenido.MULTIMEDIA };
    actualizarContenidoUseCase.execute.mockResolvedValue({
      id_contenido: idContenido,
    });

    await controller.actualizarContenido(idContenido, dto);

    expect(actualizarContenidoUseCase.execute).toHaveBeenCalledWith(
      idContenido,
      dto,
    );
  });

  it('delega la eliminación usando el identificador de la ruta', async () => {
    eliminarContenidoUseCase.execute.mockResolvedValue({
      mensaje: 'eliminado',
    });

    await controller.eliminarContenido(idContenido);

    expect(eliminarContenidoUseCase.execute).toHaveBeenCalledWith(idContenido);
  });

  it('delega la creación atómica del recurso y sus módulos', async () => {
    const dto = {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.TEXTO,
      orden_bloque: 1,
      texto_contenido: 'Orientación',
      id_modulos: ['00000000-0000-4000-8000-000000000002'],
    };
    crearRecursoContenidoUseCase.execute.mockResolvedValue({
      id_recurso: '00000000-0000-4000-8000-000000000003',
    });

    await controller.crearRecursoContenido(dto);

    expect(crearRecursoContenidoUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it.each([
    'crearUnidadTemporal',
    'crearContenido',
    'actualizarContenido',
    'eliminarContenido',
    'crearRecursoContenido',
  ] as const)(
    'protege %s con sesión completa, rol administrativo y CSRF',
    (metodo) => {
      const handler = CronogramaController.prototype[metodo];
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
      const roles = Reflect.getMetadata(ROLES_KEY, handler) as string[];
      const alcances = Reflect.getMetadata(
        ALCANCES_SESION_KEY,
        handler,
      ) as string[];

      expect(guards).toEqual([
        SessionAuthGuard,
        SessionScopeGuard,
        RolesGuard,
        CsrfSessionGuard,
      ]);
      expect(roles).toEqual([Rol.ADMINISTRATIVO]);
      expect(alcances).toEqual(['COMPLETA']);
    },
  );
});
