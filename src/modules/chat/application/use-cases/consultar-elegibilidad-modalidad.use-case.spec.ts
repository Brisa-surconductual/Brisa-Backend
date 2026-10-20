import { BadRequestException } from '@nestjs/common';
import {
  AsignacionModalidadVigente,
  ModalidadProgramaRepository,
} from '../../domain/repositories/modalidad-programa.repository';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { ConsultarElegibilidadModalidadUseCase } from './consultar-elegibilidad-modalidad.use-case';

describe('ConsultarElegibilidadModalidadUseCase', () => {
  const listarAsignacionesVigentesPorPrograma = jest.fn();

  const repositorio = {
    listarAsignacionesVigentesPorPrograma,
  } as ModalidadProgramaRepository;

  const casoDeUso = new ConsultarElegibilidadModalidadUseCase(
    repositorio,
  );

  const asignacion = (
    cambios: Partial<AsignacionModalidadVigente> = {},
  ): AsignacionModalidadVigente => ({
    idUsuario: 'usuario-1',
    modalidad: ModalidadConversacional.GRUPAL,
    rol: Rol.ESTUDIANTE,
    estadoCuenta: EstadoCuenta.ACTIVA,
    perfilCompleto: true,
    ...cambios,
  });

  beforeEach(() => {
    listarAsignacionesVigentesPorPrograma.mockReset();
  });

  it('declara elegible un programa grupal con todos los perfiles completos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({ idUsuario: 'usuario-2' }),
    ]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toEqual({
      idPrograma: 12,
      modalidadActual: ModalidadConversacional.GRUPAL,
      totalUsuariosActivos: 2,
      conPerfilCompleto: 2,
      sinPerfilCompleto: 0,
      elegible: true,
    });

    expect(listarAsignacionesVigentesPorPrograma)
      .toHaveBeenCalledWith(12);
  });

  it('rechaza la elegibilidad cuando existe un perfil incompleto', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-2',
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toMatchObject({
      totalUsuariosActivos: 2,
      conPerfilCompleto: 1,
      sinPerfilCompleto: 1,
      elegible: false,
    });
  });

  it('excluye cuentas no activas y usuarios administrativos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-2',
        estadoCuenta: EstadoCuenta.BLOQUEADA,
        perfilCompleto: false,
      }),
      asignacion({
        idUsuario: 'usuario-3',
        rol: Rol.ADMINISTRATIVO,
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toMatchObject({
      totalUsuariosActivos: 1,
      conPerfilCompleto: 1,
      sinPerfilCompleto: 0,
      elegible: true,
    });
  });

  it('rechaza programas sin participantes activos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toMatchObject({
      modalidadActual: null,
      totalUsuariosActivos: 0,
      elegible: false,
    });
  });

  it('rechaza programas con modalidades vigentes mixtas', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-2',
        modalidad: ModalidadConversacional.PERSONALIZADA,
      }),
    ]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toMatchObject({
      modalidadActual: null,
      totalUsuariosActivos: 2,
      elegible: false,
    });
  });

  it('rechaza identificadores de programa invalidos', async () => {
    await expect(casoDeUso.execute(0))
      .rejects.toBeInstanceOf(BadRequestException);

    await expect(casoDeUso.execute(1.5))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(listarAsignacionesVigentesPorPrograma)
      .not.toHaveBeenCalled();
  });

  it("ignora modalidades de participantes inactivos", async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: "usuario-bloqueado",
        estadoCuenta: EstadoCuenta.BLOQUEADA,
        modalidad: ModalidadConversacional.PERSONALIZADA,
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute(12);

    expect(resultado).toMatchObject({
      modalidadActual: ModalidadConversacional.GRUPAL,
      totalUsuariosActivos: 1,
      conPerfilCompleto: 1,
      elegible: true,
    });
  });

});
