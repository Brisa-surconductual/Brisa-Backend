import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import type { AuditoriaService } from '../../application/services/auditoria.service';
import type { VerificarPermisoIndividualUseCase } from '../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { AlcancePermiso } from '../../domain/enums/alcance-permiso.enum';
import {
  ALCANCE_PERMISO_KEY,
  MENSAJE_PERMISO_KEY,
  MENSAJE_SIN_PERMISO_INDIVIDUAL,
  PermisoIndividualGuard,
} from './permiso-individual.guard';

describe('PermisoIndividualGuard', () => {
  const idUsuario = 'a0000000-0000-4000-8000-000000000002';
  let verificar: { execute: jest.Mock };
  let auditoria: { registrarIntento: jest.Mock };
  let guard: PermisoIndividualGuard;
  let mensajeConfigurado: string | undefined;

  const contexto = (
    rol: string,
    request: { params?: object; query?: object; body?: object } = {},
  ) => {
    const req = {
      params: {},
      query: {},
      body: {},
      path: '/ruta',
      ip: '127.0.0.1',
      socket: {},
      ...request,
      autenticacion: {
        usuario: { id_usuario: idUsuario, rol },
        sesion: { id_sesion: 's0000000-0000-4000-8000-000000000001' },
      },
    };
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    verificar = { execute: jest.fn().mockResolvedValue(true) };
    auditoria = { registrarIntento: jest.fn().mockResolvedValue(undefined) };
    mensajeConfigurado = undefined;
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((clave: unknown) => {
        if (clave === ALCANCE_PERMISO_KEY)
          return AlcancePermiso.ACCESO_INDIVIDUAL;
        if (clave === MENSAJE_PERMISO_KEY) return mensajeConfigurado;
        return undefined;
      });
    guard = new PermisoIndividualGuard(
      reflector,
      verificar as unknown as VerificarPermisoIndividualUseCase,
      auditoria as unknown as AuditoriaService,
    );
  });

  it('deja pasar a COORDINADOR_PSI sin consultar permisos', async () => {
    await expect(
      guard.canActivate(
        contexto(Rol.COORDINADOR_PSI, {
          params: { codigo_participante: 'P-1' },
        }),
      ),
    ).resolves.toBe(true);
    expect(verificar.execute).not.toHaveBeenCalled();
  });

  it.each([
    [
      'params.codigo_participante',
      { params: { codigo_participante: 'p-7f3a91c2' } },
    ],
    ['params.id_participante', { params: { id_participante: 'P-7F3A91C2' } }],
    [
      'query.codigo_participante',
      { query: { codigo_participante: 'P-7F3A91C2' } },
    ],
    [
      'body.codigo_participante',
      { body: { codigo_participante: 'P-7F3A91C2' } },
    ],
  ])('toma el participante de %s', async (_origen, request) => {
    await expect(
      guard.canActivate(contexto(Rol.ADMINISTRATIVO, request)),
    ).resolves.toBe(true);
    expect(verificar.execute).toHaveBeenCalledWith(
      idUsuario,
      { codigo: 'P-7F3A91C2' },
      AlcancePermiso.ACCESO_INDIVIDUAL,
    );
  });

  it('usa la sesión de chat cuando la ruta no trae código', async () => {
    const idSesion = '33333333-3333-4333-8333-333333333333';
    await guard.canActivate(
      contexto(Rol.ADMINISTRATIVO, { params: { id_sesion: idSesion } }),
    );
    expect(verificar.execute).toHaveBeenCalledWith(
      idUsuario,
      { idSesion },
      AlcancePermiso.ACCESO_INDIVIDUAL,
    );
  });

  it('niega con 403 y audita si el ADMINISTRATIVO no tiene permiso vigente', async () => {
    verificar.execute.mockResolvedValue(false);
    const error = await guard
      .canActivate(
        contexto(Rol.ADMINISTRATIVO, {
          params: { codigo_participante: 'P-1' },
        }),
      )
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual({
      status: 403,
      codigo: 'SIN_PERMISO_INDIVIDUAL',
      mensaje: MENSAJE_SIN_PERMISO_INDIVIDUAL,
    });
    expect(auditoria.registrarIntento).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario }),
      expect.objectContaining({
        accion: 'INTENTO_ACCESO_NO_AUTORIZADO',
        severidad: 'ALTA',
      }),
      'DENEGADA',
    );
  });

  it('usa el mensaje configurado en el decorador', async () => {
    verificar.execute.mockResolvedValue(false);
    mensajeConfigurado = 'Mensaje propio de la ruta.';
    const error = await guard
      .canActivate(
        contexto(Rol.ADMINISTRATIVO, {
          params: { codigo_participante: 'P-1' },
        }),
      )
      .catch((e: unknown) => e);
    expect((error as ForbiddenException).getResponse()).toMatchObject({
      codigo: 'SIN_PERMISO_INDIVIDUAL',
      mensaje: 'Mensaje propio de la ruta.',
    });
  });

  it('niega si no se puede identificar al participante', async () => {
    await expect(
      guard.canActivate(contexto(Rol.ADMINISTRATIVO)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(verificar.execute).not.toHaveBeenCalled();
  });

  it('deja que el pipe rechace con 400 un id_sesion mal formado', async () => {
    await expect(
      guard.canActivate(
        contexto(Rol.ADMINISTRATIVO, { params: { id_sesion: 'no-uuid' } }),
      ),
    ).resolves.toBe(true);
    expect(verificar.execute).not.toHaveBeenCalled();
  });

  it('niega a cualquier otro rol', async () => {
    await expect(
      guard.canActivate(
        contexto(Rol.ESTUDIANTE, { params: { codigo_participante: 'P-1' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(verificar.execute).not.toHaveBeenCalled();
  });
});
