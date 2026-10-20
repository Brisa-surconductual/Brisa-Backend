import { BadRequestException, HttpStatus, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { CsrfSessionGuard } from '../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import type { AuthenticatedSessionRequest } from '../../usuarios/presentation/http/authenticated-session-request';
import { HabilitarModalidadPersonalizadaUseCase } from '../application/use-cases/habilitar-modalidad-personalizada.use-case';
import { HabilitarModalidadProgramaController } from './habilitar-modalidad-programa.controller';

describe('HabilitarModalidadProgramaController', () => {
  const execute = jest.fn();

  const controlador = new HabilitarModalidadProgramaController({
    execute,
  } as unknown as HabilitarModalidadPersonalizadaUseCase);

  const idAdministrador = '00000000-0000-4000-8000-000000000001';

  const solicitud = {
    autenticacion: {
      usuario: { id_usuario: idAdministrador },
    },
  } as unknown as AuthenticatedSessionRequest;

  const resultado = {
    idPrograma: 12,
    modalidad: 'PERSONALIZADA',
    usuariosActualizados: 3,
    fechaVigenciaDesde: new Date('2026-10-20T12:00:00Z'),
    administradorResponsable: idAdministrador,
  };

  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue(resultado);
  });

  it('devuelve la respuesta en el contrato HTTP esperado', async () => {
    const respuesta = await controlador.habilitar(12, true, solicitud);

    expect(respuesta).toEqual({
      id_programa: 12,
      modalidad: 'PERSONALIZADA',
      usuarios_actualizados: 3,
      fecha_vigencia_desde: '2026-10-20T12:00:00.000Z',
      administrador_responsable: idAdministrador,
    });
  });

  it('obtiene el administrador desde la sesion autenticada', async () => {
    await controlador.habilitar(12, true, solicitud);

    expect(execute).toHaveBeenCalledWith({
      idPrograma: 12,
      idAdministrador,
      confirmacionTransicion: true,
    });
  });

  it('transmite la ausencia de confirmacion al caso de uso', async () => {
    await controlador.habilitar(12, false, solicitud);

    expect(execute).toHaveBeenCalledWith({
      idPrograma: 12,
      idAdministrador,
      confirmacionTransicion: false,
    });
  });

  it('propaga los errores de validacion del caso de uso', async () => {
    const error = new BadRequestException('Confirmacion requerida');
    execute.mockRejectedValueOnce(error);

    await expect(
      controlador.habilitar(12, false, solicitud),
    ).rejects.toBe(error);
  });

  it('declara la ruta POST y el codigo HTTP 200', () => {
    const metodo = HabilitarModalidadProgramaController.prototype.habilitar;

    expect(
      Reflect.getMetadata(PATH_METADATA, HabilitarModalidadProgramaController),
    ).toBe('/chat/admin/modalidad');

    expect(Reflect.getMetadata(PATH_METADATA, metodo))
      .toBe('/habilitar-personalizada');

    expect(Reflect.getMetadata(METHOD_METADATA, metodo))
      .toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, metodo))
      .toBe(HttpStatus.OK);
  });

  it('exige rol administrativo, sesion y proteccion CSRF', () => {
    const metodo = HabilitarModalidadProgramaController.prototype.habilitar;

    expect(
      Reflect.getMetadata(ROLES_KEY, HabilitarModalidadProgramaController),
    ).toEqual([Rol.ADMINISTRATIVO]);

    expect(
      Reflect.getMetadata(GUARDS_METADATA, HabilitarModalidadProgramaController),
    ).toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);

    expect(Reflect.getMetadata(GUARDS_METADATA, metodo))
      .toEqual([CsrfSessionGuard]);
  });
});
