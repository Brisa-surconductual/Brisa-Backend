import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { AlertasGestionRepository } from '../../../domain/repositories/alertas-gestion.repository';
import type { ParticipantesCohorteRepository } from '../../../domain/repositories/participantes-cohorte.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type {
  AlertaActivaParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { ListarAlertasPendientesUseCase } from './listar-alertas-pendientes.use-case';

const COHORTE = 'c0000000-0000-4000-8000-000000000001';
const alerta = (n: number) =>
  `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const usuario = (n: number) =>
  `e0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const miembros = [
  { id_usuario: usuario(1), codigo_participante: 'P-AAAAAAAA' },
  { id_usuario: usuario(2), codigo_participante: 'P-BBBBBBBB' },
];

const loteM05 = (): AlertaActivaParticipanteM05[] => [
  {
    codigo_participante: 'P-AAAAAAAA',
    id_alerta: alerta(1),
    tipo_alerta: 'INACTIVIDAD',
    fecha_generacion: '2026-11-20T14:00:00Z',
    estado_resolucion: 'ACTIVA',
  },
  {
    codigo_participante: 'P-AAAAAAAA',
    id_alerta: alerta(2),
    tipo_alerta: 'CRAVING_ELEVADO',
    fecha_generacion: '2026-11-22T01:40:00Z',
  },
  {
    codigo_participante: 'P-BBBBBBBB',
    id_alerta: alerta(3),
    tipo_alerta: 'CRAVING_ELEVADO',
    fecha_generacion: '2026-11-12T22:15:00Z',
    estado_resolucion: 'PENDIENTE',
  },
];

describe('ListarAlertasPendientesUseCase (RF-146)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-0000000000ad',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };

  const insertar = jest.fn<
    Promise<void>,
    [Prisma.TransactionClient, RegistroAuditoria, boolean]
  >();
  const estadoCohorte = jest.fn();
  const listarActivos = jest.fn();
  const obtenerAlertasActivasLote = jest.fn<
    Promise<AlertaActivaParticipanteM05[]>,
    [string[]]
  >();
  const filtrarNoAtendidas = jest.fn<
    Promise<Set<string>>,
    [Prisma.TransactionClient, string[]]
  >();

  const useCase = new ListarAlertasPendientesUseCase(
    {
      estadoCohorte,
      listarActivos,
    } as unknown as ParticipantesCohorteRepository,
    { obtenerAlertasActivasLote } as unknown as SeguimientoIndividualPort,
    { filtrarNoAtendidas } as unknown as AlertasGestionRepository,
    new AuditoriaService(
      {
        enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
          op(tx),
        insertar,
        listar: jest.fn(),
      },
      { encolar: jest.fn() },
    ),
  );

  const registros = () => insertar.mock.calls.map(([, registro]) => registro);
  const ids = (r: Awaited<ReturnType<typeof useCase.execute>>) =>
    r?.items.map((item) => item.id_alerta);

  beforeEach(() => {
    insertar.mockReset().mockResolvedValue(undefined);
    estadoCohorte.mockReset().mockResolvedValue('ACTIVA');
    listarActivos.mockReset().mockResolvedValue(miembros);
    obtenerAlertasActivasLote.mockReset().mockResolvedValue(loteM05());
    // Sin atender: todas las que se piden.
    filtrarNoAtendidas
      .mockReset()
      .mockImplementation((_tx, idsAlerta) =>
        Promise.resolve(new Set(idsAlerta.map((id) => id.toLowerCase()))),
      );
  });

  afterEach(() => jest.useRealTimers());

  it('devuelve las pendientes de la cohorte, de la más antigua a la más reciente, con lista blanca', async () => {
    const r = await useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 });
    expect(r).toEqual({
      items: [
        {
          id_alerta: alerta(3),
          tipo_alerta: 'CRAVING_ELEVADO',
          fecha_generacion: '2026-11-12T22:15:00Z',
          codigo_participante: 'P-BBBBBBBB',
        },
        {
          id_alerta: alerta(1),
          tipo_alerta: 'INACTIVIDAD',
          fecha_generacion: '2026-11-20T14:00:00Z',
          codigo_participante: 'P-AAAAAAAA',
        },
        {
          id_alerta: alerta(2),
          tipo_alerta: 'CRAVING_ELEVADO',
          fecha_generacion: '2026-11-22T01:40:00Z',
          codigo_participante: 'P-AAAAAAAA',
        },
      ],
      total: 3,
      offset: 0,
      limit: 20,
    });
    expect(obtenerAlertasActivasLote).toHaveBeenCalledWith([
      'P-AAAAAAAA',
      'P-BBBBBBBB',
    ]);
  });

  it('excluye las ya atendidas en M-8 con el anti-join por lote', async () => {
    filtrarNoAtendidas.mockResolvedValue(new Set([alerta(1)]));
    const r = await useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 });
    expect(ids(r)).toEqual([alerta(1)]);
    expect(filtrarNoAtendidas).toHaveBeenCalledTimes(1);
    expect(filtrarNoAtendidas).toHaveBeenCalledWith(tx, [
      alerta(1),
      alerta(2),
      alerta(3),
    ]);
  });

  it('filtra por tipo antes del anti-join y pagina', async () => {
    const r = await useCase.execute(ctx, COHORTE, {
      tipo_alerta: 'CRAVING_ELEVADO',
      offset: 1,
      limit: 1,
    });
    expect(filtrarNoAtendidas).toHaveBeenCalledWith(tx, [alerta(2), alerta(3)]);
    expect(r).toMatchObject({ total: 2, offset: 1, limit: 1 });
    expect(ids(r)).toEqual([alerta(2)]);
  });

  it('descarta las cerradas en M05, las de otra cohorte y las repetidas', async () => {
    obtenerAlertasActivasLote.mockResolvedValue([
      ...loteM05(),
      { ...loteM05()[0] },
      {
        codigo_participante: 'P-00000000',
        id_alerta: alerta(9),
        tipo_alerta: 'INACTIVIDAD',
        fecha_generacion: '2026-11-01T00:00:00Z',
      },
      {
        ...loteM05()[1],
        id_alerta: alerta(8),
        estado_resolucion: 'RESUELTA',
      },
    ]);
    const r = await useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 });
    expect(ids(r)?.sort()).toEqual([alerta(1), alerta(2), alerta(3)]);
  });

  it('audita CONSULTA_AGREGADA con la cohorte como recurso', async () => {
    await useCase.execute(ctx, COHORTE, {
      tipo_alerta: 'INACTIVIDAD',
      offset: 0,
      limit: 20,
    });
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'CONSULTA_AGREGADA',
        recurso_afectado: 'ALERTAS_PENDIENTES_COHORTE',
        id_recurso: COHORTE,
        estado_accion: 'EXITOSA',
        severidad: 'MEDIA',
        detalle: {
          consulta: 'ALERTAS_PENDIENTES',
          filtros: { tipo_alerta: 'INACTIVIDAD', offset: 0, limit: 20 },
        },
      }),
    ]);
  });

  it('null (204) si todas están atendidas', async () => {
    filtrarNoAtendidas.mockResolvedValue(new Set());
    await expect(
      useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 }),
    ).resolves.toBeNull();
    expect(registros()[0]).toMatchObject({ estado_accion: 'EXITOSA' });
  });

  it('null (204) si la cohorte no tiene participantes activos, sin consultar M05', async () => {
    listarActivos.mockResolvedValue([]);
    await expect(
      useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 }),
    ).resolves.toBeNull();
    expect(obtenerAlertasActivasLote).not.toHaveBeenCalled();
  });

  it('página fuera de rango: 200 con lista vacía y el total', async () => {
    const r = await useCase.execute(ctx, COHORTE, { offset: 10, limit: 20 });
    expect(r).toEqual({ items: [], total: 3, offset: 10, limit: 20 });
  });

  it('404 COHORTE_NO_ENCONTRADA, auditado como FALLIDA', async () => {
    estadoCohorte.mockResolvedValue(null);
    const error = await useCase
      .execute(ctx, COHORTE, { offset: 0, limit: 20 })
      .catch((e: unknown) => e);
    expect((error as HttpException).getStatus()).toBe(404);
    expect(obtenerAlertasActivasLote).not.toHaveBeenCalled();
    expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
  });

  it('503 M05_NO_DISPONIBLE con el cuerpo del contrato', async () => {
    obtenerAlertasActivasLote.mockRejectedValue(new Error('caído'));
    const error = await useCase
      .execute(ctx, COHORTE, { offset: 0, limit: 20 })
      .catch((e: unknown) => e);
    expect((error as HttpException).getResponse()).toEqual({
      status: 503,
      codigo: 'M05_NO_DISPONIBLE',
      mensaje:
        'El módulo de seguimiento no se encuentra disponible en este momento.',
    });
  });

  it('503 si M05 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    obtenerAlertasActivasLote.mockReturnValue(new Promise(() => undefined));
    const resultado = useCase
      .execute(ctx, COHORTE, { offset: 0, limit: 20 })
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(2_000);
    expect(((await resultado) as HttpException).getStatus()).toBe(503);
  });

  it('sin N+1: membresías, M05 y anti-join se consultan una sola vez para 500 participantes', async () => {
    const cohorte = Array.from({ length: 500 }, (_, i) => ({
      id_usuario: usuario(i + 1),
      codigo_participante: `P-${String(i).padStart(8, '0')}`,
    }));
    listarActivos.mockResolvedValue(cohorte);
    obtenerAlertasActivasLote.mockImplementation((codigos) =>
      Promise.resolve(
        codigos.map((codigo, i) => ({
          codigo_participante: codigo,
          id_alerta: alerta(i + 1),
          tipo_alerta: 'INACTIVIDAD' as const,
          fecha_generacion: '2026-11-20T14:00:00Z',
        })),
      ),
    );
    const r = await useCase.execute(ctx, COHORTE, { offset: 0, limit: 20 });
    expect(listarActivos).toHaveBeenCalledTimes(1);
    expect(obtenerAlertasActivasLote).toHaveBeenCalledTimes(1);
    expect(filtrarNoAtendidas).toHaveBeenCalledTimes(1);
    expect(r?.total).toBe(500);
  });
});
