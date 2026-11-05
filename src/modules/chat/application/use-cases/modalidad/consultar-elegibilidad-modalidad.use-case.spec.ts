import { BadRequestException } from '@nestjs/common';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { AsignacionModalidad } from '../../../domain/entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../../../domain/entities/modalidad/asignacion-modalidad-vigente';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ConsultarElegibilidadModalidadUseCase } from './consultar-elegibilidad-modalidad.use-case';

describe('ConsultarElegibilidadModalidadUseCase', () => {
  const listarAsignacionesVigentesPorPrograma = jest.fn();

  const repositorio = {
    listarAsignacionesVigentesPorPrograma,
  } as unknown as ModalidadProgramaRepository;

  const casoDeUso = new ConsultarElegibilidadModalidadUseCase(repositorio);

  const asignacion = (
    cambios: Partial<{
      idUsuario: string;
      modalidad: ModalidadConversacional;
      esEstudiante: boolean;
      cuentaActiva: boolean;
      perfilCompleto: boolean;
    }> = {},
  ): AsignacionModalidadVigente => {
    const datos = {
      idUsuario: 'usuario-1',
      modalidad: ModalidadConversacional.GRUPAL,
      esEstudiante: true,
      cuentaActiva: true,
      perfilCompleto: true,
      ...cambios,
    };

    return new AsignacionModalidadVigente(
      new AsignacionModalidad(
        `asignacion-${datos.idUsuario}`,
        datos.idUsuario,
        12,
        datos.modalidad,
        new Date('2026-10-01T00:00:00Z'),
      ),
      datos.esEstudiante,
      datos.cuentaActiva,
      datos.perfilCompleto,
    );
  };

  beforeEach(() => {
    listarAsignacionesVigentesPorPrograma.mockReset();
  });

  it('declara elegible un programa grupal con todos los perfiles completos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({ idUsuario: 'usuario-2' }),
    ]);

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toEqual({
      id_programa: 12,
      modalidad_actual: ModalidadConversacional.GRUPAL,
      total_usuarios_activos: 2,
      con_perfil_completo: 2,
      sin_perfil_completo: 0,
      elegible: true,
    });

    expect(listarAsignacionesVigentesPorPrograma).toHaveBeenCalledWith(12);
  });

  it('rechaza la elegibilidad cuando existe un perfil incompleto', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-2',
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toMatchObject({
      total_usuarios_activos: 2,
      con_perfil_completo: 1,
      sin_perfil_completo: 1,
      elegible: false,
    });
  });

  it('excluye cuentas no activas y usuarios administrativos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-2',
        cuentaActiva: false,
        perfilCompleto: false,
      }),
      asignacion({
        idUsuario: 'usuario-3',
        esEstudiante: false,
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toMatchObject({
      total_usuarios_activos: 1,
      con_perfil_completo: 1,
      sin_perfil_completo: 0,
      elegible: true,
    });
  });

  it('rechaza programas sin participantes activos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([]);

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toMatchObject({
      modalidad_actual: null,
      total_usuarios_activos: 0,
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

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toMatchObject({
      modalidad_actual: null,
      total_usuarios_activos: 2,
      elegible: false,
    });
  });

  it('rechaza identificadores de programa invalidos', async () => {
    await expect(casoDeUso.execute({ id_programa: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(
      casoDeUso.execute({ id_programa: 1.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(listarAsignacionesVigentesPorPrograma).not.toHaveBeenCalled();
  });

  it('ignora modalidades de participantes inactivos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      asignacion(),
      asignacion({
        idUsuario: 'usuario-bloqueado',
        cuentaActiva: false,
        modalidad: ModalidadConversacional.PERSONALIZADA,
        perfilCompleto: false,
      }),
    ]);

    const resultado = await casoDeUso.execute({ id_programa: 12 });

    expect(resultado).toMatchObject({
      modalidad_actual: ModalidadConversacional.GRUPAL,
      total_usuarios_activos: 1,
      con_perfil_completo: 1,
      elegible: true,
    });
  });
});
