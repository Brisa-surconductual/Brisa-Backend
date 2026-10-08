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
import { ChatController } from './chat.controller';

describe('ChatController (RF-25)', () => {
  const crearFlujo = { execute: jest.fn() };
  const listarTipos = { execute: jest.fn() };
  const consultarArbol = { execute: jest.fn() };
  const crearNodo = { execute: jest.fn() };
  const actualizarNodo = { execute: jest.fn() };
  const crearTransicion = { execute: jest.fn() };
  const actualizarTransicion = { execute: jest.fn() };
  const validarArbol = { execute: jest.fn() };
  const publicarArbol = { execute: jest.fn() };
  const controller = new ChatController(
    crearFlujo as never,
    listarTipos as never,
    consultarArbol as never,
    crearNodo as never,
    actualizarNodo as never,
    crearTransicion as never,
    actualizarTransicion as never,
    validarArbol as never,
    publicarArbol as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('restringe todo el controlador a sesiones completas administrativas', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ChatController)).toEqual([
      Rol.ADMINISTRATIVO,
    ]);
    expect(Reflect.getMetadata(ALCANCES_SESION_KEY, ChatController)).toEqual([
      AlcanceSesion.COMPLETA,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ChatController)).toEqual([
      SessionAuthGuard,
      SessionScopeGuard,
      RolesGuard,
    ]);
  });

  it.each([
    'crearFlujo',
    'crearNodo',
    'actualizarNodo',
    'crearTransicion',
    'actualizarTransicion',
    'validarArbol',
    'publicarArbol',
  ] as const)('protege la mutación %s con CSRF', (metodo) => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ChatController.prototype[metodo]),
    ).toContain(CsrfSessionGuard);
  });

  it('rechaza con HTTP 403 a un usuario no administrativo', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = () => controller.listarTiposNodo();
    const context = {
      getHandler: () => handler,
      getClass: () => ChatController,
      switchToHttp: () => ({
        getRequest: () => ({
          autenticacion: { usuario: { rol: Rol.ESTUDIANTE } },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('usa la identidad del administrador autenticado al crear el flujo', async () => {
    const idAdministrador = '00000000-0000-4000-8000-000000000001';
    const dto = { nombre: 'Árbol grupal', version: 1 };
    crearFlujo.execute.mockResolvedValue({ id_flujo: 'flujo' });

    await controller.crearFlujo(dto, {
      autenticacion: { usuario: { id_usuario: idAdministrador } },
    } as never);

    expect(crearFlujo.execute).toHaveBeenCalledWith(dto, idAdministrador);
  });
});
