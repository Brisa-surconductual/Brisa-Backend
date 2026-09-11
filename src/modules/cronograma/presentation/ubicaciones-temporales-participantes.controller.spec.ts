import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { ConsultarUbicacionesTemporalesParticipantesUseCase } from '../application/use-cases/cronograma/consultar-ubicaciones-temporales-participantes.use-case';
import { AlcanceSesion } from '../../usuarios/domain/enums/alcance-sesion.enum';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { ALCANCES_SESION_KEY } from '../../usuarios/presentation/decorators/alcances-sesion.decorator';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { UbicacionesTemporalesParticipantesController } from './ubicaciones-temporales-participantes.controller';

describe('UbicacionesTemporalesParticipantesController', () => {
  const execute = jest.fn();
  const controller = new UbicacionesTemporalesParticipantesController({
    execute,
  } as unknown as ConsultarUbicacionesTemporalesParticipantesUseCase);

  beforeEach(() => jest.clearAllMocks());

  it('delega la consulta agregada y conserva sus filtros', async () => {
    const dto = {
      page: 1,
      page_size: 50,
      fecha_calculo: new Date('2026-09-15T12:00:00.000Z'),
    };
    execute.mockResolvedValue({ total: 0, participantes: [] });

    await expect(controller.consultar(dto)).resolves.toEqual({
      total: 0,
      participantes: [],
    });
    expect(execute).toHaveBeenCalledWith(dto);
  });

  it('exige sesión completa y rol administrativo', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      UbicacionesTemporalesParticipantesController.prototype,
      'consultar',
    );
    const handler = descriptor?.value as (...args: unknown[]) => unknown;
    const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, handler);
    const roles: unknown = Reflect.getMetadata(ROLES_KEY, handler);
    const alcances: unknown = Reflect.getMetadata(ALCANCES_SESION_KEY, handler);

    expect(guards).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);
    expect(roles).toEqual([Rol.ADMINISTRATIVO]);
    expect(alcances).toEqual([AlcanceSesion.COMPLETA]);
  });
});
