import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ROLES_KEY } from '../../../shared/presentation/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/presentation/guards/role-guard';
import { Rol } from '../../usuarios/domain/enums/rol.enum';
import { SessionAuthGuard } from '../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../usuarios/presentation/guards/session-scope.guard';
import { ModalidadConversacional } from '../domain/enums/arbol-conversacional.enums';
import { ConsultarElegibilidadModalidadUseCase } from '../application/use-cases/consultar-elegibilidad-modalidad.use-case';
import { ModalidadProgramaAdminController } from './modalidad-programa-admin.controller';

describe('ModalidadProgramaAdminController', () => {
  const execute = jest.fn();
  let controller: ModalidadProgramaAdminController;

  beforeEach(async () => {
    execute.mockReset();

    const modulo = await Test.createTestingModule({
      controllers: [ModalidadProgramaAdminController],
      providers: [
        {
          provide: ConsultarElegibilidadModalidadUseCase,
          useValue: { execute },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = modulo.get(ModalidadProgramaAdminController);
  });

  it('consulta el programa y transforma la respuesta al contrato HTTP', async () => {
    execute.mockResolvedValue({
      idPrograma: 12,
      modalidadActual: ModalidadConversacional.GRUPAL,
      totalUsuariosActivos: 3,
      conPerfilCompleto: 2,
      sinPerfilCompleto: 1,
      elegible: false,
    });

    const resultado = await controller.consultarElegibilidadPrograma(12);

    expect(execute).toHaveBeenCalledWith(12);
    expect(resultado).toEqual({
      id_programa: 12,
      modalidad_actual: 'GRUPAL',
      total_usuarios_activos: 3,
      con_perfil_completo: 2,
      sin_perfil_completo: 1,
      elegible: false,
    });
  });

  it('conserva la modalidad nula cuando no puede determinarse', async () => {
    execute.mockResolvedValue({
      idPrograma: 12,
      modalidadActual: null,
      totalUsuariosActivos: 0,
      conPerfilCompleto: 0,
      sinPerfilCompleto: 0,
      elegible: false,
    });

    const resultado = await controller.consultarElegibilidadPrograma(12);

    expect(resultado.modalidad_actual).toBeNull();
    expect(resultado.elegible).toBe(false);
  });

  it('declara la ruta GET de elegibilidad', () => {
    const metodo =
      ModalidadProgramaAdminController.prototype.consultarElegibilidadPrograma;

    expect(Reflect.getMetadata(PATH_METADATA, ModalidadProgramaAdminController))
      .toBe('/chat/admin/modalidad');

    expect(Reflect.getMetadata(PATH_METADATA, metodo))
      .toBe('/elegibilidad');

    expect(Reflect.getMetadata(METHOD_METADATA, metodo))
      .toBe(RequestMethod.GET);
  });

  it('exige autenticacion, alcance de sesion y rol administrativo', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ModalidadProgramaAdminController))
      .toEqual([Rol.ADMINISTRATIVO]);

    expect(Reflect.getMetadata(GUARDS_METADATA, ModalidadProgramaAdminController))
      .toEqual([SessionAuthGuard, SessionScopeGuard, RolesGuard]);
  });
});
