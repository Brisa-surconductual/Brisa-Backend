import { EstadoPausa } from '../../domain/enums/estado-pausa.enum';
import { PausaAdministrativa } from '../../domain/entities/pausa-administrativa.entity';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../domain/exeption/cronograma/cronograma-usuario-activo-no-encontrado.exception';
import { FechaInicioPausaFueraRangoException } from '../../domain/exeption/pausa-administrativa/fecha-inicio-pausa-fuera-rango.exception';
import { FechasPausaInvalidasException } from '../../domain/exeption/pausa-administrativa/fechas-pausa-invalidas.exception';
import { PausaAdministrativaSolapadaException } from '../../domain/exeption/pausa-administrativa/pausa-administrativa-solapada.exception';
import { PrismaPausaAdministrativaRepository } from './prisma-pausa-administrativa.repository';

describe('PrismaPausaAdministrativaRepository (RF-22B)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idCronogramaUsuario = '00000000-0000-4000-8000-000000000003';
  const idPausa = '00000000-0000-4000-8000-000000000004';
  let consultaEjecutada: unknown;
  let resultadoQuery: unknown[] = [];
  const queryRaw = jest.fn((consulta: unknown): Promise<unknown[]> => {
    consultaEjecutada = consulta;
    return Promise.resolve(resultadoQuery);
  });
  const prisma = {
    $queryRaw: queryRaw,
    cronogramas_usuario: { findFirst: jest.fn() },
    pausas_administrativas: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const repository = new PrismaPausaAdministrativaRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    consultaEjecutada = undefined;
    resultadoQuery = [];
  });

  it('calcula el rango individual conservando la duración de la plantilla', async () => {
    prisma.cronogramas_usuario.findFirst.mockResolvedValue({
      id_cronograma_usuario: idCronogramaUsuario,
      fecha_inicio_usuario: new Date('2026-09-07T15:00:00.000Z'),
      cronogramas: {
        unidades_temporales: [
          {
            fecha_inicio: new Date('2026-01-01T00:00:00.000Z'),
            fecha_fin: new Date('2026-01-08T00:00:00.000Z'),
          },
          {
            fecha_inicio: new Date('2026-01-08T00:00:00.000Z'),
            fecha_fin: new Date('2026-01-22T00:00:00.000Z'),
          },
        ],
      },
    });

    await expect(
      repository.buscarContextoCronogramaActivo(idUsuario),
    ).resolves.toEqual({
      idCronogramaUsuario,
      fechaInicioUsuario: new Date('2026-09-07T15:00:00.000Z'),
      fechaFinUsuario: new Date('2026-09-28T15:00:00.000Z'),
    });
    expect(prisma.cronogramas_usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id_usuario: idUsuario,
          usuarios: { is: { rol: 'ESTUDIANTE' } },
          cronogramas: { is: { estado: 'ACTIVO' } },
        },
      }),
    );
  });

  it('considera inexistente un contexto sin unidades temporales', async () => {
    prisma.cronogramas_usuario.findFirst.mockResolvedValue({
      id_cronograma_usuario: idCronogramaUsuario,
      fecha_inicio_usuario: new Date(),
      cronogramas: { unidades_temporales: [] },
    });

    await expect(
      repository.buscarContextoCronogramaActivo(idUsuario),
    ).resolves.toBeNull();
  });

  it('consulta solapamiento solo contra pausas no anuladas y con extremos abiertos', async () => {
    prisma.pausas_administrativas.findFirst.mockResolvedValue({
      id_pausa: '00000000-0000-4000-8000-000000000004',
    });
    const inicio = new Date('2026-09-10T12:00:00.000Z');
    const fin = new Date('2026-09-12T12:00:00.000Z');

    await expect(
      repository.existeSolapamiento(idCronogramaUsuario, inicio, fin),
    ).resolves.toBe(true);
    expect(prisma.pausas_administrativas.findFirst).toHaveBeenCalledWith({
      where: {
        id_cronograma_usuario: idCronogramaUsuario,
        estado_pausa: { not: 'ANULADA' },
        fecha_inicio_pausa: { lt: fin },
        fecha_fin_pausa: { gt: inicio },
      },
      select: { id_pausa: true },
    });
  });

  it('persiste y reconstruye la pausa', async () => {
    const pausa = crearPausa();
    prisma.pausas_administrativas.create.mockResolvedValue({ ...pausa });

    await expect(repository.crear(pausa)).resolves.toMatchObject({
      id_pausa: pausa.id_pausa,
      estado_pausa: EstadoPausa.ACTIVA,
    });
  });

  it('consulta el historial mediante parámetros y conserva los estados derivados por la BD', async () => {
    const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
    resultadoQuery = [
      { ...crearPausa(), estado_pausa: EstadoPausa.FINALIZADA },
      { ...crearPausa(), id_pausa: idPausa, estado_pausa: EstadoPausa.ANULADA },
    ];

    await expect(
      repository.listarPorUsuario(idUsuario, fechaConsulta),
    ).resolves.toEqual([
      expect.objectContaining({ estado_pausa: EstadoPausa.FINALIZADA }),
      expect.objectContaining({ estado_pausa: EstadoPausa.ANULADA }),
    ]);

    const consulta = consultaEjecutada as {
      strings: string[];
      values: unknown[];
    };
    expect(consulta.strings.join('')).toContain(
      'cronograma.fn_historial_pausas_administrativas_usuario',
    );
    expect(consulta.values).toEqual([idUsuario, fechaConsulta]);
  });

  it('anula de forma acotada al usuario y devuelve el registro actualizado', async () => {
    const anulada = {
      ...crearPausa(),
      estado_pausa: EstadoPausa.ANULADA,
    };
    prisma.pausas_administrativas.updateMany.mockResolvedValue({ count: 1 });
    prisma.pausas_administrativas.findFirst.mockResolvedValue(anulada);

    await expect(repository.anular(idUsuario, idPausa)).resolves.toMatchObject({
      id_pausa: idPausa,
      id_usuario: idUsuario,
      estado_pausa: EstadoPausa.ANULADA,
    });
    expect(prisma.pausas_administrativas.updateMany).toHaveBeenCalledWith({
      where: {
        id_pausa: idPausa,
        id_usuario: idUsuario,
        estado_pausa: { not: 'ANULADA' },
      },
      data: { estado_pausa: 'ANULADA' },
    });
    expect(prisma.pausas_administrativas.findFirst).toHaveBeenCalledWith({
      where: { id_pausa: idPausa, id_usuario: idUsuario },
    });
  });

  it('mantiene idempotencia si la pausa ya estaba anulada', async () => {
    prisma.pausas_administrativas.updateMany.mockResolvedValue({ count: 0 });
    prisma.pausas_administrativas.findFirst.mockResolvedValue({
      ...crearPausa(),
      estado_pausa: EstadoPausa.ANULADA,
    });

    await expect(repository.anular(idUsuario, idPausa)).resolves.toMatchObject({
      estado_pausa: EstadoPausa.ANULADA,
    });
  });

  it('no expone una pausa que no pertenece al usuario indicado', async () => {
    prisma.pausas_administrativas.updateMany.mockResolvedValue({ count: 0 });
    prisma.pausas_administrativas.findFirst.mockResolvedValue(null);

    await expect(repository.anular(idUsuario, idPausa)).resolves.toBeNull();
  });

  it.each([
    ['constraint ex_pausa_sin_solape', PausaAdministrativaSolapadaException],
    ['constraint ck_pausa_fechas', FechasPausaInvalidasException],
    [
      'La fecha de inicio de la pausa debe encontrarse dentro del rango',
      FechaInicioPausaFueraRangoException,
    ],
    [
      'constraint trg_pausa_validar_rango: no tiene un cronograma activo asignado',
      CronogramaUsuarioActivoNoEncontradoException,
    ],
  ])('traduce %s a una excepción HTTP segura', async (message, exception) => {
    prisma.pausas_administrativas.create.mockRejectedValue({
      code: 'P2004',
      message,
    });

    await expect(repository.crear(crearPausa())).rejects.toBeInstanceOf(
      exception,
    );
  });

  function crearPausa(): PausaAdministrativa {
    return new PausaAdministrativa(
      idPausa,
      idUsuario,
      idCronogramaUsuario,
      new Date('2026-09-10T12:00:00.000Z'),
      new Date('2026-09-12T12:00:00.000Z'),
      'Incapacidad médica',
      '00000000-0000-4000-8000-000000000002',
      new Date('2026-09-07T12:00:00.000Z'),
      EstadoPausa.ACTIVA,
    );
  }
});
