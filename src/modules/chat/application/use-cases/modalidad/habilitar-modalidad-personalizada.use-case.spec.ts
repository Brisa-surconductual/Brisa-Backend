import { BadRequestException } from '@nestjs/common';
import { AsignacionModalidad } from '../../../domain/entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../../../domain/entities/modalidad/asignacion-modalidad-vigente';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  ModalidadNoGrupalException,
  PerfilesIncompletosException,
  SinAsignacionesVigentesException,
  SinParticipantesActivosException,
  TransicionConcurrenteException,
} from '../../../domain/exceptions';
import { ModalidadProgramaRepository } from '../../../domain/repositories/modalidad-programa.repository';
import { HabilitarModalidadPersonalizadaUseCase } from './habilitar-modalidad-personalizada.use-case';

describe('HabilitarModalidadPersonalizadaUseCase', () => {
  const listarAsignacionesVigentesPorPrograma = jest.fn();
  const guardarAsignaciones = jest.fn();

  const repositorio = {
    listarAsignacionesVigentesPorPrograma,
    guardarAsignaciones,
  } as unknown as ModalidadProgramaRepository;

  const casoDeUso = new HabilitarModalidadPersonalizadaUseCase(repositorio);

  const idAdministrador = '00000000-0000-4000-8000-000000000001';
  const dto = { id_programa: 12, confirmacion_transicion: true };

  const vigente = (
    idUsuario: string,
    cambios: Partial<{
      modalidad: ModalidadConversacional;
      esEstudiante: boolean;
      cuentaActiva: boolean;
      perfilCompleto: boolean;
    }> = {},
  ): AsignacionModalidadVigente => {
    const datos = {
      modalidad: ModalidadConversacional.GRUPAL,
      esEstudiante: true,
      cuentaActiva: true,
      perfilCompleto: true,
      ...cambios,
    };

    return new AsignacionModalidadVigente(
      new AsignacionModalidad(
        `asignacion-${idUsuario}`,
        idUsuario,
        dto.id_programa,
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
    guardarAsignaciones.mockReset();
  });

  it('cierra las asignaciones grupales y crea las personalizadas', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1'),
      vigente('usuario-2'),
    ]);

    const resultado = await casoDeUso.execute(dto, idAdministrador);

    expect(resultado).toMatchObject({
      id_programa: 12,
      modalidad: ModalidadConversacional.PERSONALIZADA,
      usuarios_actualizados: 2,
      administrador_responsable: idAdministrador,
    });

    expect(guardarAsignaciones).toHaveBeenCalledTimes(1);

    const guardadas = guardarAsignaciones.mock
      .calls[0][0] as AsignacionModalidad[];

    expect(guardadas).toHaveLength(4);
    expect(guardadas.filter((a) => !a.vigente)).toHaveLength(2);
    expect(
      guardadas
        .filter((a) => a.vigente)
        .every(
          (a) =>
            a.modalidad === ModalidadConversacional.PERSONALIZADA &&
            a.administradorResponsable === idAdministrador,
        ),
    ).toBe(true);
  });

  it('ignora cuentas inactivas al transicionar', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1'),
      vigente('usuario-2', { cuentaActiva: false, perfilCompleto: false }),
    ]);

    const resultado = await casoDeUso.execute(dto, idAdministrador);

    expect(resultado.usuarios_actualizados).toBe(1);
    expect(guardarAsignaciones.mock.calls[0][0]).toHaveLength(2);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rechaza idPrograma invalido: %s',
    async (idPrograma) => {
      await expect(
        casoDeUso.execute({ ...dto, id_programa: idPrograma }, idAdministrador),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(guardarAsignaciones).not.toHaveBeenCalled();
    },
  );

  it.each(['', '   '])(
    'rechaza un administrador vacio',
    async (administradorVacio) => {
      await expect(
        casoDeUso.execute(dto, administradorVacio),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(guardarAsignaciones).not.toHaveBeenCalled();
    },
  );

  it('rechaza una transicion sin confirmacion explicita', async () => {
    await expect(
      casoDeUso.execute(
        { ...dto, confirmacion_transicion: false },
        idAdministrador,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(guardarAsignaciones).not.toHaveBeenCalled();
  });

  it('rechaza un programa sin asignaciones vigentes', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([]);

    await expect(
      casoDeUso.execute(dto, idAdministrador),
    ).rejects.toBeInstanceOf(SinAsignacionesVigentesException);
  });

  it('rechaza cuando algun participante activo no esta en modalidad grupal', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1'),
      vigente('usuario-2', {
        modalidad: ModalidadConversacional.PERSONALIZADA,
      }),
    ]);

    await expect(
      casoDeUso.execute(dto, idAdministrador),
    ).rejects.toBeInstanceOf(ModalidadNoGrupalException);
    expect(guardarAsignaciones).not.toHaveBeenCalled();
  });

  it('rechaza cuando no hay participantes activos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1', { cuentaActiva: false }),
    ]);

    await expect(
      casoDeUso.execute(dto, idAdministrador),
    ).rejects.toBeInstanceOf(SinParticipantesActivosException);
  });

  it('rechaza cuando hay perfiles incompletos e informa cuantos', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1'),
      vigente('usuario-2', { perfilCompleto: false }),
    ]);

    const error = await casoDeUso
      .execute(dto, idAdministrador)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PerfilesIncompletosException);
    expect((error as PerfilesIncompletosException).detalles).toEqual({
      sin_perfil_completo: 1,
    });
  });

  it('propaga el conflicto de concurrencia del repositorio', async () => {
    listarAsignacionesVigentesPorPrograma.mockResolvedValue([
      vigente('usuario-1'),
    ]);
    const error = new TransicionConcurrenteException();
    guardarAsignaciones.mockRejectedValue(error);

    await expect(casoDeUso.execute(dto, idAdministrador)).rejects.toBe(error);
  });
});
