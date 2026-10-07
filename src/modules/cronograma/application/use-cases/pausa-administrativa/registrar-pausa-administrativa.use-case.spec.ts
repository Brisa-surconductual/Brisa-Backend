import { PausaAdministrativa } from '../../../domain/entities/pausa-administrativa.entity';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-usuario-activo-no-encontrado.exception';
import { FechaInicioPausaFueraRangoException } from '../../../domain/exeption/pausa-administrativa/fecha-inicio-pausa-fuera-rango.exception';
import { FechasPausaInvalidasException } from '../../../domain/exeption/pausa-administrativa/fechas-pausa-invalidas.exception';
import { PausaAdministrativaSolapadaException } from '../../../domain/exeption/pausa-administrativa/pausa-administrativa-solapada.exception';
import { RegistroPausaAdministrativaException } from '../../../domain/exeption/pausa-administrativa/registro-pausa-administrativa.exception';
import { PausaAdministrativaRepository } from '../../../domain/repositories/pausa-administrativa.repository';
import { RegistrarPausaAdministrativaUseCase } from './registrar-pausa-administrativa.use-case';

describe('RegistrarPausaAdministrativaUseCase (RF-22B)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idAdministrador = '00000000-0000-4000-8000-000000000002';
  const idCronogramaUsuario = '00000000-0000-4000-8000-000000000003';
  const repository: jest.Mocked<PausaAdministrativaRepository> = {
    buscarContextoCronogramaActivo: jest.fn(),
    existeSolapamiento: jest.fn(),
    crear: jest.fn(),
    listarPorUsuario: jest.fn(),
    anular: jest.fn(),
  };
  const useCase = new RegistrarPausaAdministrativaUseCase(repository);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.buscarContextoCronogramaActivo.mockResolvedValue({
      idCronogramaUsuario,
      fechaInicioUsuario: new Date('2026-09-01T12:00:00.000Z'),
      fechaFinUsuario: new Date('2026-10-01T12:00:00.000Z'),
    });
    repository.existeSolapamiento.mockResolvedValue(false);
    repository.crear.mockImplementation((pausa) => Promise.resolve(pausa));
  });

  it('registra la pausa usando el administrador autenticado y el cronograma resuelto', async () => {
    const resultado = await useCase.execute(idUsuario, idAdministrador, {
      fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
      fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
      motivo_pausa: '  Incapacidad médica  ',
    });

    const pausaCreada = repository.crear.mock.calls[0][0];
    expect(pausaCreada).toMatchObject({
      id_usuario: idUsuario,
      id_cronograma_usuario: idCronogramaUsuario,
      id_usuario_administrativo: idAdministrador,
      motivo_pausa: 'Incapacidad médica',
      estado_pausa: 'ACTIVA',
    });
    expect(resultado).toMatchObject({
      id_pausa: pausaCreada.id_pausa,
      mensaje: 'Pausa administrativa registrada correctamente.',
    });
  });

  it('retorna 422 cuando el usuario no tiene cronograma activo con rango', async () => {
    repository.buscarContextoCronogramaActivo.mockResolvedValue(null);

    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
        motivo_pausa: 'Incapacidad médica',
      }),
    ).rejects.toBeInstanceOf(CronogramaUsuarioActivoNoEncontradoException);
    expect(repository.crear.mock.calls).toHaveLength(0);
  });

  it.each([
    new Date('2026-08-31T11:59:59.999Z'),
    new Date('2026-10-01T12:00:00.001Z'),
  ])('retorna 422 cuando el inicio %s está fuera del rango', async (inicio) => {
    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: inicio,
        fecha_fin_pausa: new Date('2026-10-02T12:00:00.000Z'),
        motivo_pausa: 'Decisión administrativa',
      }),
    ).rejects.toBeInstanceOf(FechaInicioPausaFueraRangoException);
    expect(repository.existeSolapamiento.mock.calls).toHaveLength(0);
  });

  it('retorna 400 si la fecha final es anterior a la inicial', async () => {
    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: new Date('2026-09-12T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-10T12:00:00.000Z'),
        motivo_pausa: 'Decisión administrativa',
      }),
    ).rejects.toBeInstanceOf(FechasPausaInvalidasException);
    expect(repository.buscarContextoCronogramaActivo.mock.calls).toHaveLength(
      0,
    );
  });

  it('retorna 409 cuando el intervalo se solapa', async () => {
    repository.existeSolapamiento.mockResolvedValue(true);

    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
        motivo_pausa: 'Decisión administrativa',
      }),
    ).rejects.toBeInstanceOf(PausaAdministrativaSolapadaException);
    expect(repository.crear.mock.calls).toHaveLength(0);
  });

  it('permite una pausa instantánea sin consultar solapamientos', async () => {
    const fecha = new Date('2026-09-10T12:00:00.000Z');

    await useCase.execute(idUsuario, idAdministrador, {
      fecha_inicio_pausa: fecha,
      fecha_fin_pausa: fecha,
      motivo_pausa: 'Registro puntual',
    });

    expect(repository.existeSolapamiento.mock.calls).toHaveLength(0);
    expect(repository.crear.mock.calls[0][0]).toBeInstanceOf(
      PausaAdministrativa,
    );
  });

  it('conserva el 409 producido por la restricción ante una carrera', async () => {
    repository.crear.mockRejectedValue(
      new PausaAdministrativaSolapadaException(),
    );

    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
        motivo_pausa: 'Decisión administrativa',
      }),
    ).rejects.toBeInstanceOf(PausaAdministrativaSolapadaException);
  });

  it('oculta detalles internos cuando ocurre un error inesperado', async () => {
    repository.crear.mockRejectedValue(new Error('database unavailable'));

    await expect(
      useCase.execute(idUsuario, idAdministrador, {
        fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
        motivo_pausa: 'Decisión administrativa',
      }),
    ).rejects.toBeInstanceOf(RegistroPausaAdministrativaException);
  });
});
