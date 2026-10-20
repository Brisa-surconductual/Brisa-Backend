import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ContenidoVigenteChatController } from './contenido-vigente-chat.controller';

describe('ContenidoVigenteChatController', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();
  const controller = new ContenidoVigenteChatController({ execute } as never);
  const request = {
    autenticacion: { usuario: { id_usuario: idUsuario } },
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('requiere estudiante y sesión completa mediante los guards existentes', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ContenidoVigenteChatController),
    ).toEqual([Rol.ESTUDIANTE]);
    expect(
      Reflect.getMetadata(ALCANCES_SESION_KEY, ContenidoVigenteChatController),
    ).toEqual([AlcanceSesion.COMPLETA]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ContenidoVigenteChatController),
    ).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);
  });

  it('usa exclusivamente la identidad del contexto autenticado', async () => {
    execute.mockResolvedValue([{ id_contenido: 'contenido-1' }]);
    const status = jest.fn();
    await expect(
      controller.consultar(request, {}, { status } as never),
    ).resolves.toHaveLength(1);
    expect(execute.mock.calls).toEqual([[idUsuario]]);
    expect(status).not.toHaveBeenCalled();
  });

  it('retorna 204 sin cuerpo cuando no existe contenido vigente', async () => {
    execute.mockResolvedValue([]);
    const status = jest.fn();
    await expect(
      controller.consultar(request, {}, { status } as never),
    ).resolves.toBeUndefined();
    expect(status).toHaveBeenCalledWith(204);
  });

  it.each(['id_usuario', 'fecha_consulta', 'codigo_modulo'])(
    'rechaza el parámetro %s antes de consultar Cronograma',
    async (campo) => {
      await expect(
        controller.consultar(request, { [campo]: 'valor' }, {} as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(execute).not.toHaveBeenCalled();
    },
  );
});
