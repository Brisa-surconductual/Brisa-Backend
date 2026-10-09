import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { CronogramaUsuarioNoAsignadoException } from '../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { ContenidoVigenteAdministrativoController } from './contenido-vigente-administrativo.controller';

describe('ContenidoVigenteAdministrativoController', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();
  const controller = new ContenidoVigenteAdministrativoController({
    execute,
  } as never);

  beforeEach(() => jest.clearAllMocks());

  it('requiere rol administrativo y sesión completa mediante los guards existentes', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ContenidoVigenteAdministrativoController),
    ).toEqual([Rol.ADMINISTRATIVO]);
    expect(
      Reflect.getMetadata(
        ALCANCES_SESION_KEY,
        ContenidoVigenteAdministrativoController,
      ),
    ).toEqual([AlcanceSesion.COMPLETA]);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        ContenidoVigenteAdministrativoController,
      ),
    ).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);
  });

  it('reutiliza RF-21 con el usuario de la ruta sin permitir una fecha del cliente', async () => {
    execute.mockResolvedValue([{ id_contenido: 'contenido-1' }]);
    const status = jest.fn();

    await expect(
      controller.consultar(idUsuario, {}, { status } as never),
    ).resolves.toEqual([{ id_contenido: 'contenido-1' }]);
    expect(execute.mock.calls).toEqual([[idUsuario]]);
    expect(status).not.toHaveBeenCalled();
  });

  it('retorna 204 sin cuerpo cuando no existe contenido vigente', async () => {
    execute.mockResolvedValue([]);
    const status = jest.fn();

    await expect(
      controller.consultar(idUsuario, {}, { status } as never),
    ).resolves.toBeUndefined();
    expect(status).toHaveBeenCalledWith(204);
  });

  it.each(['id_usuario', 'fecha_consulta', 'codigo_modulo', 'otro'])(
    'rechaza el parámetro %s antes de consultar',
    async (campo) => {
      await expect(
        controller.consultar(idUsuario, { [campo]: 'valor' }, {} as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('conserva los errores de negocio del caso de uso existente', async () => {
    const error = new CronogramaUsuarioNoAsignadoException();
    execute.mockRejectedValue(error);

    await expect(controller.consultar(idUsuario, {}, {} as never)).rejects.toBe(
      error,
    );
  });
});
