import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { BitacoraRepository } from '../../ports/auditoria.port';
import type {
  NarrativaIndividualPort,
  ProgresionNarrativaM06,
} from '../../ports/narrativa-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { ConsultarProgresionNarrativaUseCase } from './consultar-progresion-narrativa.use-case';

const CODIGO = 'P-7F3A91C2';
const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';

const progresionM06 = (
  cambios: Partial<ProgresionNarrativaM06> = {},
): ProgresionNarrativaM06 => ({
  id_usuario: ID_PARTICIPANTE,
  id_perfil_narrativo: '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b',
  id_fase_activa: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  nombre_fase_activa: 'DESARROLLO',
  id_capitulo_completado: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
  nivel_gamificacion_actual: 3,
  logros_narrativos_desbloqueados: [
    {
      id_logro: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
      nombre_logro: 'Primer paso',
      fecha_desbloqueo: '2026-10-30T18:00:00Z',
    },
  ],
  fecha_actualizacion_progresion: '2026-11-22T05:00:00Z',
  estado_progresion_narrativa: 'ACTIVA',
  ...cambios,
});

describe('ConsultarProgresionNarrativaUseCase (RF-130)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };

  const insertar = jest.fn<
    Promise<void>,
    [Prisma.TransactionClient, RegistroAuditoria, boolean]
  >();
  const buscarIdParticipante = jest.fn<
    Promise<string | null>,
    [Prisma.TransactionClient, string]
  >();
  const obtenerProgresionNarrativa = jest.fn<
    Promise<ProgresionNarrativaM06 | null>,
    [string]
  >();

  const bitacora = {
    enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
      op(tx),
    insertar,
    listar: jest.fn(),
  } as unknown as BitacoraRepository;
  const repositorio = {
    buscarIdParticipante,
    buscarAlertasAtendidas: jest.fn(),
  } as unknown as SeguimientoIndividualRepository;
  const useCase = new ConsultarProgresionNarrativaUseCase(
    { obtenerProgresionNarrativa } satisfies NarrativaIndividualPort,
    new SeguimientoIndividualService(repositorio),
    repositorio,
    new AuditoriaService(bitacora, { encolar: jest.fn() }),
  );

  const registros = () => insertar.mock.calls.map(([, registro]) => registro);
  const errorDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    return error as HttpException;
  };

  beforeEach(() => {
    insertar.mockReset().mockResolvedValue(undefined);
    buscarIdParticipante.mockReset().mockResolvedValue(ID_PARTICIPANTE);
    obtenerProgresionNarrativa.mockReset().mockResolvedValue(progresionM06());
  });

  afterEach(() => jest.useRealTimers());

  it('devuelve la progresión del contrato en solo lectura y audita CONSULTA_PARTICIPANTE ALTA', async () => {
    await expect(useCase.execute(ctx, CODIGO)).resolves.toEqual({
      codigo_participante: CODIGO,
      id_fase_activa: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
      nombre_fase_activa: 'DESARROLLO',
      id_capitulo_completado: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
      logros_narrativos_desbloqueados: [
        {
          id_logro: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
          nombre_logro: 'Primer paso',
          fecha_desbloqueo: '2026-10-30T18:00:00Z',
        },
      ],
      modo_consulta: 'SOLO_LECTURA',
    });
    // Consulta a M06 por el id interno del participante, nunca por el código.
    expect(obtenerProgresionNarrativa).toHaveBeenCalledWith(ID_PARTICIPANTE);
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'CONSULTA_PARTICIPANTE',
        recurso_afectado: 'PROGRESION_NARRATIVA_INDIVIDUAL',
        estado_accion: 'EXITOSA',
        severidad: 'ALTA',
        id_participante: ID_PARTICIPANTE,
        detalle: {
          consulta: 'PROGRESION_NARRATIVA',
          codigo_participante: CODIGO,
        },
      }),
    ]);
  });

  it('acepta el id_usuario de M06 en mayúsculas', async () => {
    obtenerProgresionNarrativa.mockResolvedValue(
      progresionM06({ id_usuario: ID_PARTICIPANTE.toUpperCase() }),
    );
    await expect(useCase.execute(ctx, CODIGO)).resolves.not.toBeNull();
  });

  it('presenta una progresión inicial sin capítulos ni logros (200)', async () => {
    obtenerProgresionNarrativa.mockResolvedValue(
      progresionM06({
        nombre_fase_activa: 'INICIO',
        id_capitulo_completado: null,
        logros_narrativos_desbloqueados: [],
        estado_progresion_narrativa: 'INICIAL',
      }),
    );
    await expect(useCase.execute(ctx, CODIGO)).resolves.toMatchObject({
      nombre_fase_activa: 'INICIO',
      id_capitulo_completado: null,
      logros_narrativos_desbloqueados: [],
    });
  });

  it('no expone el nivel de gamificación ni datos internos de M06', async () => {
    const respuesta = await useCase.execute(ctx, CODIGO);
    expect(respuesta).not.toHaveProperty('nivel_gamificacion_actual');
    expect(respuesta).not.toHaveProperty('id_perfil_narrativo');
    expect(respuesta).not.toHaveProperty('id_usuario');
  });

  it('devuelve null (204) si no hay perfil narrativo, y deja la consulta auditada', async () => {
    obtenerProgresionNarrativa.mockResolvedValue(null);
    await expect(useCase.execute(ctx, CODIGO)).resolves.toBeNull();
    expect(registros()[0]).toMatchObject({ estado_accion: 'EXITOSA' });
  });

  it('409 si M06 responde por otro usuario, auditado como FALLIDA con severidad ALTA', async () => {
    obtenerProgresionNarrativa.mockResolvedValue(
      progresionM06({ id_usuario: '00000000-0000-4000-8000-000000000006' }),
    );
    const error = await errorDe(useCase.execute(ctx, CODIGO));
    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toMatchObject({
      codigo: 'INCONSISTENCIA_PARTICIPANTE',
    });
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'CONSULTA_PARTICIPANTE',
        estado_accion: 'FALLIDA',
        severidad: 'ALTA',
        id_participante: ID_PARTICIPANTE,
      }),
    ]);
  });

  it('404 si el participante no existe, sin consultar M06', async () => {
    buscarIdParticipante.mockResolvedValue(null);
    const error = await errorDe(useCase.execute(ctx, CODIGO));
    expect(error.getStatus()).toBe(404);
    expect(obtenerProgresionNarrativa).not.toHaveBeenCalled();
  });

  it('503 M06_NO_DISPONIBLE si M06 falla', async () => {
    obtenerProgresionNarrativa.mockRejectedValue(new Error('caído'));
    const error = await errorDe(useCase.execute(ctx, CODIGO));
    expect(error.getResponse()).toEqual({
      status: 503,
      codigo: 'M06_NO_DISPONIBLE',
      mensaje:
        'El módulo de gamificación no se encuentra disponible en este momento.',
    });
    expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
  });

  it('503 si M06 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    obtenerProgresionNarrativa.mockReturnValue(new Promise(() => undefined));
    const resultado = useCase.execute(ctx, CODIGO).catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(2_000);
    const error = (await resultado) as HttpException;
    expect(error.getStatus()).toBe(503);
  });

  it('500 sin datos si la auditoría síncrona falla', async () => {
    insertar.mockRejectedValue(new Error('bitácora caída'));
    const error = await errorDe(useCase.execute(ctx, CODIGO));
    expect(error.getStatus()).toBe(500);
    expect(error.getResponse()).toMatchObject({
      codigo: 'ERROR_REGISTRO_AUDITORIA',
    });
  });

  it('500 con el mensaje de RF-130 ante un fallo inesperado', async () => {
    buscarIdParticipante.mockImplementation(() => {
      throw new TypeError('fallo inesperado');
    });
    const error = await errorDe(useCase.execute(ctx, CODIGO));
    expect(error.getResponse()).toEqual({
      status: 500,
      codigo: 'ERROR_CONSULTA_NARRATIVA',
      mensaje:
        'No fue posible cargar la progresión narrativa individual del participante.',
    });
  });
});
