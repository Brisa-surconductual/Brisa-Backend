import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ArbolPersonalizadoController } from './arbol-personalizado.controller';

describe('ArbolPersonalizadoController (RF-25C)', () => {
  const crear = { execute: jest.fn() };
  const clonar = { execute: jest.fn() };
  const listar = { execute: jest.fn() };
  const consultar = { execute: jest.fn() };
  const publicado = { execute: jest.fn() };
  const publicar = { execute: jest.fn() };
  const archivar = { execute: jest.fn() };
  const auditoria = { execute: jest.fn() };
  const eliminar = { execute: jest.fn() };
  const controller = new ArbolPersonalizadoController(
    crear as never,
    clonar as never,
    listar as never,
    consultar as never,
    publicado as never,
    publicar as never,
    archivar as never,
    auditoria as never,
    eliminar as never,
  );

  it('exige rol administrativo y sesión completa', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ArbolPersonalizadoController),
    ).toEqual([Rol.ADMINISTRATIVO]);
    expect(
      Reflect.getMetadata(ALCANCES_SESION_KEY, ArbolPersonalizadoController),
    ).toEqual([AlcanceSesion.COMPLETA]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ArbolPersonalizadoController),
    ).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);
  });

  it.each([
    'crear',
    'clonarVersion',
    'publicar',
    'archivar',
    'eliminar',
  ] as const)('protege %s con CSRF', (metodo) => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        ArbolPersonalizadoController.prototype[metodo],
      ),
    ).toContain(CsrfSessionGuard);
  });

  it('deniega HTTP 403 a estudiantes', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = () => controller.listar();
    const context = {
      getHandler: () => handler,
      getClass: () => ArbolPersonalizadoController,
      switchToHttp: () => ({
        getRequest: () => ({
          autenticacion: { usuario: { rol: Rol.ESTUDIANTE } },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('atribuye publicación y archivado al usuario de la sesión', async () => {
    const idFlujo = '00000000-0000-4000-8000-000000000001';
    const idActor = '00000000-0000-4000-8000-000000000002';
    const request = {
      autenticacion: { usuario: { id_usuario: idActor } },
    } as never;
    publicar.execute.mockResolvedValue({ id_flujo: idFlujo });
    archivar.execute.mockResolvedValue({ id_flujo: idFlujo });

    await controller.publicar(idFlujo, request);
    await controller.archivar(idFlujo, request);

    expect(publicar.execute.mock.calls).toEqual([[idFlujo, idActor]]);
    expect(archivar.execute.mock.calls).toEqual([[idFlujo, idActor]]);
  });
});
