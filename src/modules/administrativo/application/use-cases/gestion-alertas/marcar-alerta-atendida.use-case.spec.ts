import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { EstadoResolucionAlerta } from '../../../domain/enums/estado-resolucion-alerta.enum';
import type {
  AlertasGestionRepository,
  NuevaAtencionAlerta,
} from '../../../domain/repositories/alertas-gestion.repository';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { RegistroAuditoriaException } from '../../exceptions/registro-auditoria.exception';
import type { BitacoraRepository } from '../../ports/auditoria.port';
import type {
  AlertaParticipanteM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import type { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { MarcarAlertaAtendidaUseCase } from './marcar-alerta-atendida.use-case';

const CODIGO = 'P-7F3A91C2';
const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';
const ID_ALERTA = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const MOTIVO = 'Se contactó al participante y se agendó una sesión.';

const alertaM05 = (
  estado: EstadoResolucionAlerta | null = 'ACTIVA',
  cambios: Partial<AlertaParticipanteM05['alerta']> = {},
): AlertaParticipanteM05 => ({
  codigo_participante: CODIGO,
  alerta: {
    id_alerta: ID_ALERTA,
    tipo_alerta: 'CRAVING_ELEVADO',
    fuente_alerta: 'RF-63',
    fecha_generacion: '2026-11-22T01:40:00Z',
    estado_resolucion: estado,
    ...cambios,
  },
});

describe('MarcarAlertaAtendidaUseCase (RF-147)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };

  const orden: string[] = [];
  const buscarIdParticipante = jest.fn<
    Promise<string | null>,
    [Prisma.TransactionClient, string]
  >();
  const buscarAlertasAtendidas = jest.fn<
    Promise<Map<string, Date>>,
    [Prisma.TransactionClient, string, string[]]
  >();
  const buscarAlerta = jest.fn<
    Promise<AlertaParticipanteM05 | null>,
    [string]
  >();
  const registrarAtencion = jest.fn<
    Promise<{ id_alerta_gestion: string; fecha_atencion: Date }>,
    [Prisma.TransactionClient, NuevaAtencionAlerta, ContextoAuditoria]
  >();
  const registrarIntento = jest.fn<
    Promise<void>,
    [ContextoAuditoria, AccionAuditable, string]
  >();

  const repositorio = {
    buscarIdParticipante,
    buscarAlertasAtendidas,
  } as unknown as SeguimientoIndividualRepository;
  const useCase = new MarcarAlertaAtendidaUseCase(
    { buscarAlerta } as unknown as SeguimientoIndividualPort,
    new SeguimientoIndividualService(repositorio),
    repositorio,
    { registrarAtencion } as unknown as AlertasGestionRepository,
    {
      enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) => {
        orden.push('transaccion');
        return op(tx);
      },
    } as unknown as BitacoraRepository,
    { registrarIntento } as unknown as AuditoriaService,
  );

  const errorDe = async (motivo = MOTIVO) => {
    const error = await useCase
      .execute(ctx, ID_ALERTA, motivo)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    const http = error as HttpException;
    return {
      status: http.getStatus(),
      cuerpo: http.getResponse() as { codigo: string; mensaje: string },
    };
  };

  beforeEach(() => {
    orden.length = 0;
    buscarIdParticipante.mockReset().mockResolvedValue(ID_PARTICIPANTE);
    buscarAlertasAtendidas.mockReset().mockResolvedValue(new Map());
    buscarAlerta.mockReset().mockImplementation(() => {
      orden.push('m05');
      return Promise.resolve(alertaM05());
    });
    registrarAtencion.mockReset().mockResolvedValue({
      id_alerta_gestion: 'g0000000-0000-4000-8000-000000000001',
      fecha_atencion: new Date('2026-11-23T03:20:00Z'),
    });
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => jest.useRealTimers());

  it('responde con el contrato y registra la atención con tipo y participante de M05', async () => {
    await expect(
      useCase.execute(ctx, ID_ALERTA, `   ${MOTIVO}   `),
    ).resolves.toEqual({
      id_alerta: ID_ALERTA,
      estado: 'ATENDIDA',
      fecha_atencion: '2026-11-23T03:20:00.000Z',
    });
    expect(buscarAlerta).toHaveBeenCalledWith(ID_ALERTA);
    expect(buscarIdParticipante).toHaveBeenCalledWith(tx, CODIGO);
    expect(registrarAtencion).toHaveBeenCalledWith(
      tx,
      {
        id_alerta: ID_ALERTA,
        tipo_alerta: 'CRAVING_ELEVADO',
        id_participante: ID_PARTICIPANTE,
        motivo: MOTIVO,
      },
      ctx,
    );
    // El éxito lo audita fn_atender_alerta en la misma transacción.
    expect(registrarIntento).not.toHaveBeenCalled();
  });

  it('consulta M05 antes de abrir la transacción', async () => {
    await useCase.execute(ctx, ID_ALERTA, MOTIVO);
    expect(orden).toEqual(['m05', 'transaccion']);
  });

  it.each(['PENDIENTE', null] as const)(
    'acepta una alerta %s en M05',
    async (estado) => {
      buscarAlerta.mockResolvedValue(alertaM05(estado));
      await expect(
        useCase.execute(ctx, ID_ALERTA, MOTIVO),
      ).resolves.toMatchObject({ estado: 'ATENDIDA' });
    },
  );

  it('404 ALERTA_NO_ENCONTRADA si M05 no conoce la alerta, sin abrir la transacción', async () => {
    buscarAlerta.mockResolvedValue(null);
    await expect(errorDe()).resolves.toEqual({
      status: 404,
      cuerpo: {
        status: 404,
        codigo: 'ALERTA_NO_ENCONTRADA',
        mensaje: 'La alerta especificada no existe en el sistema.',
      },
    });
    expect(orden).not.toContain('transaccion');
  });

  it('404 si M05 responde por otra alerta', async () => {
    buscarAlerta.mockResolvedValue(
      alertaM05('ACTIVA', {
        id_alerta: '00000000-0000-4000-8000-000000000000',
      }),
    );
    await expect(errorDe()).resolves.toMatchObject({ status: 404 });
    expect(registrarAtencion).not.toHaveBeenCalled();
  });

  it('404 si el participante al que M05 atribuye la alerta no existe en M-8', async () => {
    buscarIdParticipante.mockResolvedValue(null);
    await expect(errorDe()).resolves.toMatchObject({
      status: 404,
      cuerpo: { codigo: 'ALERTA_NO_ENCONTRADA' },
    });
    expect(registrarAtencion).not.toHaveBeenCalled();
  });

  it('409 ALERTA_YA_ATENDIDA si ya se atendió en M-8 (no se puede revertir)', async () => {
    buscarAlertasAtendidas.mockResolvedValue(
      new Map([[ID_ALERTA, new Date('2026-11-21T00:00:00Z')]]),
    );
    await expect(errorDe()).resolves.toEqual({
      status: 409,
      cuerpo: {
        status: 409,
        codigo: 'ALERTA_YA_ATENDIDA',
        mensaje:
          'La alerta ya se encuentra registrada como atendida y no puede ser modificada.',
      },
    });
    expect(registrarAtencion).not.toHaveBeenCalled();
  });

  it.each(['ATENDIDA', 'RESUELTA'] as const)(
    '409 ALERTA_YA_ATENDIDA si M05 la informa %s',
    async (estado) => {
      buscarAlerta.mockResolvedValue(alertaM05(estado));
      await expect(errorDe()).resolves.toMatchObject({
        status: 409,
        cuerpo: { codigo: 'ALERTA_YA_ATENDIDA' },
      });
    },
  );

  it.each(['EN_REVISION', 'DESCARTADA'] as const)(
    '409 ALERTA_NO_ACTIVA si M05 la informa %s',
    async (estado) => {
      buscarAlerta.mockResolvedValue(alertaM05(estado));
      await expect(errorDe()).resolves.toMatchObject({
        status: 409,
        cuerpo: { codigo: 'ALERTA_NO_ACTIVA' },
      });
    },
  );

  it('503 si M05 no responde', async () => {
    buscarAlerta.mockRejectedValue(new Error('caído'));
    await expect(errorDe()).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M05_NO_DISPONIBLE' },
    });
  });

  it('503 si M05 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    buscarAlerta.mockReturnValue(new Promise(() => undefined));
    const resultado = errorDe();
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(resultado).resolves.toMatchObject({ status: 503 });
  });

  it.each([
    ['falla la persistencia', new Error('rollback')],
    ['falla la auditoría de la transacción', new RegistroAuditoriaException()],
  ])(
    '500 ERROR_TRANSACCION con el mensaje del contrato si %s',
    async (_caso, fallo) => {
      registrarAtencion.mockRejectedValue(fallo);
      await expect(errorDe()).resolves.toEqual({
        status: 500,
        cuerpo: {
          status: 500,
          codigo: 'ERROR_TRANSACCION',
          mensaje:
            'No fue posible registrar la acción. La alerta conserva su estado.',
        },
      });
    },
  );

  it.each(['', '   ', 'corto'])(
    '422 MOTIVO_INVALIDO sin un motivo válido (%j), sin consultar M05',
    async (motivo) => {
      await expect(errorDe(motivo)).resolves.toMatchObject({
        status: 422,
        cuerpo: { codigo: 'MOTIVO_INVALIDO' },
      });
      expect(buscarAlerta).not.toHaveBeenCalled();
    },
  );

  it('cada fallo queda en la bitácora como FALLIDA, con el participante y severidad ALTA', async () => {
    buscarAlerta.mockResolvedValue(alertaM05('RESUELTA'));
    await errorDe();
    expect(registrarIntento).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        accion: 'GESTION_ALERTA',
        recurso: 'ALERTA_PARTICIPANTE',
        idRecurso: ID_ALERTA,
        idParticipante: ID_PARTICIPANTE,
        severidad: 'ALTA',
        detalle: {
          operacion: 'MARCAR_ATENDIDA',
          id_alerta: ID_ALERTA,
          codigo_participante: CODIGO,
        },
      }),
      'FALLIDA',
    );
  });
});
