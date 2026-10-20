import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { TransicionModalidadProgramaRepository } from '../../domain/repositories/transicion-modalidad-programa.repository';
import { HabilitarModalidadPersonalizadaUseCase } from './habilitar-modalidad-personalizada.use-case';

describe('HabilitarModalidadPersonalizadaUseCase', () => {
  const habilitarPersonalizada = jest.fn();

  const repositorio = {
    habilitarPersonalizada,
  } as TransicionModalidadProgramaRepository;

  const casoDeUso = new HabilitarModalidadPersonalizadaUseCase(
    repositorio,
  );

  const solicitud = {
    idPrograma: 12,
    idAdministrador: '00000000-0000-4000-8000-000000000001',
    confirmacionTransicion: true,
  };

  beforeEach(() => {
    habilitarPersonalizada.mockReset();
  });

  it('delega la transicion confirmada al repositorio', async () => {
    const resultado = {
      idPrograma: 12,
      modalidad: ModalidadConversacional.PERSONALIZADA,
      usuariosActualizados: 3,
      fechaVigenciaDesde: new Date('2026-10-20T12:00:00Z'),
      administradorResponsable: solicitud.idAdministrador,
    };

    habilitarPersonalizada.mockResolvedValue(resultado);

    await expect(casoDeUso.execute(solicitud))
      .resolves.toEqual(resultado);

    expect(habilitarPersonalizada).toHaveBeenCalledWith({
      idPrograma: 12,
      idAdministrador: solicitud.idAdministrador,
    });
    expect(habilitarPersonalizada).toHaveBeenCalledTimes(1);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rechaza idPrograma invalido: %s',
    async (idPrograma) => {
      await expect(
        casoDeUso.execute({ ...solicitud, idPrograma }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(habilitarPersonalizada).not.toHaveBeenCalled();
    },
  );

  it.each(['', '   '])(
    'rechaza un administrador vacio',
    async (idAdministrador) => {
      await expect(
        casoDeUso.execute({ ...solicitud, idAdministrador }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(habilitarPersonalizada).not.toHaveBeenCalled();
    },
  );

  it('rechaza una transicion sin confirmacion explicita', async () => {
    await expect(
      casoDeUso.execute({
        ...solicitud,
        confirmacionTransicion: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(habilitarPersonalizada).not.toHaveBeenCalled();
  });

  it('propaga un conflicto de elegibilidad del repositorio', async () => {
    const error = new ConflictException('PERFILES_INCOMPLETOS');
    habilitarPersonalizada.mockRejectedValue(error);

    await expect(casoDeUso.execute(solicitud))
      .rejects.toBe(error);

    expect(habilitarPersonalizada).toHaveBeenCalledTimes(1);
  });
});
