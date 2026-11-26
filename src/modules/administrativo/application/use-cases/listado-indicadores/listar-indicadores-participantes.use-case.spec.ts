import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { ParticipantesCohorteRepository } from '../../../domain/repositories/participantes-cohorte.repository';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type {
  IndicadoresParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import {
  type ConsultaListadoIndicadores,
  ListarIndicadoresParticipantesUseCase,
} from './listar-indicadores-participantes.use-case';

const COHORTE = 'c0000000-0000-4000-8000-000000000001';
const uuid = (n: number) =>
  `e0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const alerta = (n: number) =>
  `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const miembros = [
  { id_usuario: uuid(1), codigo_participante: 'P-AAAAAAAA' },
  { id_usuario: uuid(2), codigo_participante: 'P-BBBBBBBB' },
  { id_usuario: uuid(3), codigo_participante: 'P-CCCCCCCC' },
];

const loteM05 = (): IndicadoresParticipanteM05[] => [
  {
    codigo_participante: 'P-AAAAAAAA',
    nivel_progreso: 'EN_AVANCE',
    tasa_adherencia: 0.41,
    alertas_activas: [
      { id_alerta: alerta(1), tipo_alerta: 'INACTIVIDAD' },
      {
        id_alerta: alerta(2),
        tipo_alerta: 'CRAVING_ELEVADO',
        estado_resolucion: 'ACTIVA',
      },
    ],
  },
  {
    codigo_participante: 'P-BBBBBBBB',
    nivel_progreso: 'COMPLETADO',
    tasa_adherencia: 0.9,
    alertas_activas: [],
  },
  // P-CCCCCCCC no tiene datos en M05.
];

const consulta = (
  cambios: Partial<ConsultaListadoIndicadores> = {},
): ConsultaListadoIndicadores => ({
  filtros: {},
  orden: { campo: 'codigo_participante', direccion: 'ASC' },
  pagina: { offset: 0, limit: 20 },
  camposRestringidos: [],
  ...cambios,
});

describe('ListarIndicadoresParticipantesUseCase (RF-142)', () => {
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
  const obtenerIndicadoresLote = jest.fn<
    Promise<IndicadoresParticipanteM05[]>,
    [string[]]
  >();
  const buscarAlertasAtendidasLote = jest.fn<
    Promise<Set<string>>,
    [Prisma.TransactionClient, string[], string[]]
  >();

  const repoSeguimiento = {
    buscarIdParticipante: jest.fn(),
    buscarAlertasAtendidas: jest.fn(),
    buscarAlertasAtendidasLote,
  } as unknown as SeguimientoIndividualRepository;
  const useCase = new ListarIndicadoresParticipantesUseCase(
    {
      estadoCohorte,
      listarActivos,
    } as unknown as ParticipantesCohorteRepository,
    { obtenerIndicadoresLote } as unknown as SeguimientoIndividualPort,
    new SeguimientoIndividualService(repoSeguimiento),
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
  const errorDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    const http = error as HttpException;
    return { status: http.getStatus(), cuerpo: http.getResponse() };
  };

  beforeEach(() => {
    insertar.mockReset().mockResolvedValue(undefined);
    estadoCohorte.mockReset().mockResolvedValue('ACTIVA');
    listarActivos.mockReset().mockResolvedValue(miembros);
    obtenerIndicadoresLote.mockReset().mockResolvedValue(loteM05());
    buscarAlertasAtendidasLote
      .mockReset()
      .mockResolvedValue(new Set([`${uuid(1)}:${alerta(2)}`]));
  });

  afterEach(() => jest.useRealTimers());

  it('lista a todos con sus indicadores, separando alertas atendidas y no atendidas', async () => {
    await expect(useCase.execute(ctx, COHORTE, consulta())).resolves.toEqual({
      items: [
        {
          codigo_participante: 'P-AAAAAAAA',
          nivel_progreso: 'EN_AVANCE',
          tasa_adherencia: 0.41,
          alertas_activas: 1,
          alertas_atendidas: 1,
          tipos_alerta_activa: ['INACTIVIDAD'],
        },
        {
          codigo_participante: 'P-BBBBBBBB',
          nivel_progreso: 'COMPLETADO',
          tasa_adherencia: 0.9,
          alertas_activas: 0,
          alertas_atendidas: 0,
          tipos_alerta_activa: [],
        },
        {
          codigo_participante: 'P-CCCCCCCC',
          nivel_progreso: null,
          tasa_adherencia: null,
          alertas_activas: 0,
          alertas_atendidas: 0,
          tipos_alerta_activa: [],
        },
      ],
      total: 3,
      offset: 0,
      limit: 20,
    });
    expect(obtenerIndicadoresLote).toHaveBeenCalledWith([
      'P-AAAAAAAA',
      'P-BBBBBBBB',
      'P-CCCCCCCC',
    ]);
  });

  it('audita CONSULTA_PARTICIPANTE con la cohorte como recurso, en la misma transacción', async () => {
    await useCase.execute(
      ctx,
      COHORTE,
      consulta({
        filtros: { con_alertas: true },
        orden: { campo: 'tasa_adherencia', direccion: 'DESC' },
      }),
    );
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'CONSULTA_PARTICIPANTE',
        recurso_afectado: 'INDICADORES_PARTICIPANTES_COHORTE',
        id_recurso: COHORTE,
        estado_accion: 'EXITOSA',
        severidad: 'MEDIA',
        detalle: {
          consulta: 'LISTADO_INDICADORES',
          filtros: {
            con_alertas: true,
            orden_campo: 'tasa_adherencia',
            orden_direccion: 'DESC',
            offset: 0,
            limit: 20,
          },
        },
      }),
    ]);
    expect(insertar.mock.calls[0][0]).toBe(tx);
  });

  it('filtra, ordena y pagina en el back; con_alertas usa las no atendidas', async () => {
    const r = await useCase.execute(
      ctx,
      COHORTE,
      consulta({
        filtros: { con_alertas: false },
        orden: { campo: 'tasa_adherencia', direccion: 'ASC' },
        pagina: { offset: 0, limit: 1 },
      }),
    );
    expect(r.total).toBe(2);
    expect(r.items.map((f) => f.codigo_participante)).toEqual(['P-BBBBBBBB']);
  });

  it('lista blanca: los campos extra de M05 nunca llegan a la respuesta', async () => {
    obtenerIndicadoresLote.mockResolvedValue([
      {
        ...loteM05()[1],
        texto_diario: 'secreto',
        correo: 'persona@correo.com',
        mensajes_chat: ['hola'],
      } as IndicadoresParticipanteM05,
    ]);
    const r = await useCase.execute(ctx, COHORTE, consulta());
    const serializado = JSON.stringify(r);
    expect(serializado).not.toContain('secreto');
    expect(serializado).not.toContain('correo');
    expect(serializado).not.toContain('mensajes_chat');
    expect(Object.keys(r.items[0]).sort()).toEqual([
      'alertas_activas',
      'alertas_atendidas',
      'codigo_participante',
      'nivel_progreso',
      'tasa_adherencia',
      'tipos_alerta_activa',
    ]);
  });

  it('descarta filas de M05 ajenas a la cohorte o repetidas (aislamiento)', async () => {
    obtenerIndicadoresLote.mockResolvedValue([
      { ...loteM05()[1], codigo_participante: 'P-00000000' },
      loteM05()[0],
      { ...loteM05()[0], tasa_adherencia: 0.99 },
    ]);
    const r = await useCase.execute(ctx, COHORTE, consulta());
    expect(r.items.map((f) => f.codigo_participante)).toEqual([
      'P-AAAAAAAA',
      'P-BBBBBBBB',
      'P-CCCCCCCC',
    ]);
    expect(r.items[0].tasa_adherencia).toBe(0.41);
    expect(r.items[1].tasa_adherencia).toBeNull();
  });

  it('cohorte sin participantes activos: 200 vacío con mensaje, sin consultar M05', async () => {
    listarActivos.mockResolvedValue([]);
    await expect(useCase.execute(ctx, COHORTE, consulta())).resolves.toEqual({
      items: [],
      total: 0,
      offset: 0,
      limit: 20,
      mensaje:
        'No se encontraron participantes registrados para la cohorte seleccionada.',
    });
    expect(obtenerIndicadoresLote).not.toHaveBeenCalled();
  });

  it('filtros sin coincidencias: lista vacía sin mensaje', async () => {
    const r = await useCase.execute(
      ctx,
      COHORTE,
      consulta({ filtros: { nivel_progreso: 'INICIAL' } }),
    );
    expect(r).toEqual({ items: [], total: 0, offset: 0, limit: 20 });
  });

  it('404 COHORTE_NO_ENCONTRADA, sin consultar M05, auditado como FALLIDA', async () => {
    estadoCohorte.mockResolvedValue(null);
    await expect(
      errorDe(useCase.execute(ctx, COHORTE, consulta())),
    ).resolves.toEqual({
      status: 404,
      cuerpo: {
        status: 404,
        codigo: 'COHORTE_NO_ENCONTRADA',
        mensaje: 'La cohorte solicitada no existe en el sistema.',
      },
    });
    expect(obtenerIndicadoresLote).not.toHaveBeenCalled();
    expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
  });

  it('503 M05_NO_DISPONIBLE si M05 falla', async () => {
    obtenerIndicadoresLote.mockRejectedValue(new Error('caído'));
    await expect(
      errorDe(useCase.execute(ctx, COHORTE, consulta())),
    ).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M05_NO_DISPONIBLE' },
    });
  });

  it('503 si M05 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    obtenerIndicadoresLote.mockReturnValue(new Promise(() => undefined));
    const resultado = errorDe(useCase.execute(ctx, COHORTE, consulta()));
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(resultado).resolves.toMatchObject({ status: 503 });
  });

  it('500 si falla la auditoría síncrona, sin devolver datos', async () => {
    insertar.mockRejectedValue(new Error('bitácora caída'));
    await expect(
      errorDe(useCase.execute(ctx, COHORTE, consulta())),
    ).resolves.toMatchObject({
      status: 500,
      cuerpo: { codigo: 'ERROR_REGISTRO_AUDITORIA' },
    });
  });

  it('intento de extracción: audita INTENTO_EXTRACCION_RESTRINGIDA ALTA y responde 200 igual', async () => {
    const r = await useCase.execute(
      ctx,
      COHORTE,
      consulta({ camposRestringidos: ['texto_diario', 'correo'] }),
    );
    expect(r.items).toHaveLength(3);
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'INTENTO_EXTRACCION_RESTRINGIDA',
        recurso_afectado: 'INDICADORES_PARTICIPANTES_COHORTE',
        id_recurso: COHORTE,
        estado_accion: 'DENEGADA',
        severidad: 'ALTA',
        detalle: { campos_descartados: ['texto_diario', 'correo'] },
      }),
      expect.objectContaining({
        accion: 'CONSULTA_PARTICIPANTE',
        estado_accion: 'EXITOSA',
      }),
    ]);
  });

  it('sin N+1: 500 participantes con una consulta de membresías, una llamada a M05 y una de alertas, en menos de 2 s', async () => {
    const cohorte = Array.from({ length: 500 }, (_, i) => ({
      id_usuario: uuid(i + 1),
      codigo_participante: `P-${String(i).padStart(8, '0')}`,
    }));
    listarActivos.mockResolvedValue(cohorte);
    obtenerIndicadoresLote.mockImplementation((codigos) =>
      Promise.resolve(
        codigos.map((codigo, i) => ({
          codigo_participante: codigo,
          nivel_progreso: 'EN_AVANCE' as const,
          tasa_adherencia: (i % 100) / 100,
          alertas_activas: [
            { id_alerta: alerta(i + 1), tipo_alerta: 'INACTIVIDAD' as const },
          ],
        })),
      ),
    );
    buscarAlertasAtendidasLote.mockResolvedValue(new Set());

    const inicio = performance.now();
    const r = await useCase.execute(
      ctx,
      COHORTE,
      consulta({
        filtros: { adherencia_max: 0.5, con_alertas: true },
        orden: { campo: 'tasa_adherencia', direccion: 'DESC' },
      }),
    );
    expect(performance.now() - inicio).toBeLessThan(2_000);
    expect(listarActivos).toHaveBeenCalledTimes(1);
    expect(obtenerIndicadoresLote).toHaveBeenCalledTimes(1);
    expect(obtenerIndicadoresLote.mock.calls[0][0]).toHaveLength(500);
    expect(buscarAlertasAtendidasLote).toHaveBeenCalledTimes(1);
    expect(r.total).toBe(255);
    expect(r.items[0].tasa_adherencia).toBe(0.5);
  });
});
