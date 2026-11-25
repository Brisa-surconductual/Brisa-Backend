import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { EstadoResolucionAlerta } from '../../../domain/enums/estado-resolucion-alerta.enum';
import type { NuevaAtencionAlerta } from '../../../domain/repositories/alertas-gestion.repository';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { GestionAlertaException } from '../../exceptions/gestion-alerta.exception';
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
  codigo = CODIGO,
): AlertaParticipanteM05 => ({
  codigo_participante: codigo,
  alerta: {
    id_alerta: ID_ALERTA,
    tipo_alerta: 'INACTIVIDAD',
    fuente_alerta: 'RF-68',
    fecha_generacion: '2026-11-20T14:00:00Z',
    estado_resolucion: estado,
  },
});

describe('MarcarAlertaAtendidaUseCase (RF-147)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };

  const buscarIdParticipante = jest.fn<
    Promise<string | null>,
    [Prisma.TransactionClient, string]
  >();
  const buscarAlertasAtendidas = jest.fn<
    Promise<Map<string, Date>>,
    [Prisma.TransactionClient, string, string[]]
  >();
  const obtenerAlerta = jest.fn<
    Promise<AlertaParticipanteM05 | null>,
    [string, string]
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
    { obtenerAlerta } as unknown as SeguimientoIndividualPort,
    new SeguimientoIndividualService(repositorio),
    repositorio,
    { registrarAtencion },
    {
      enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
        op(tx),
    } as unknown as BitacoraRepository,
    { registrarIntento } as unknown as AuditoriaService,
  );

  const errorDe = async (motivo = MOTIVO) => {
    const error = await useCase
      .execute(ctx, CODIGO, ID_ALERTA, motivo)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    const http = error as HttpException;
    return {
      status: http.getStatus(),
      codigo: (http.getResponse() as { codigo: string }).codigo,
    };
  };

  beforeEach(() => {
    buscarIdParticipante.mockReset().mockResolvedValue(ID_PARTICIPANTE);
    buscarAlertasAtendidas.mockReset().mockResolvedValue(new Map());
    obtenerAlerta.mockReset().mockResolvedValue(alertaM05());
    registrarAtencion.mockReset().mockResolvedValue({
      id_alerta_gestion: 'g0000000-0000-4000-8000-000000000001',
      fecha_atencion: new Date('2026-11-25T15:00:00Z'),
    });
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  it('registra la atención con el motivo recortado y la devuelve como ATENDIDA', async () => {
    await expect(
      useCase.execute(ctx, CODIGO, ID_ALERTA, `   ${MOTIVO}   `),
    ).resolves.toEqual({
      id_alerta: ID_ALERTA,
      tipo_alerta: 'INACTIVIDAD',
      estado_resolucion: 'ATENDIDA',
      fecha_resolucion: '2026-11-25T15:00:00.000Z',
      motivo: MOTIVO,
    });
    expect(registrarAtencion).toHaveBeenCalledWith(
      tx,
      {
        id_alerta: ID_ALERTA,
        tipo_alerta: 'INACTIVIDAD',
        id_participante: ID_PARTICIPANTE,
        motivo: MOTIVO,
      },
      ctx,
    );
    expect(buscarAlertasAtendidas).toHaveBeenCalledWith(tx, ID_PARTICIPANTE, [
      ID_ALERTA,
    ]);
    // El éxito lo audita fn_atender_alerta en la misma transacción.
    expect(registrarIntento).not.toHaveBeenCalled();
  });

  it.each(['PENDIENTE', null] as const)(
    'acepta una alerta %s en M05',
    async (estado) => {
      obtenerAlerta.mockResolvedValue(alertaM05(estado));
      await expect(
        useCase.execute(ctx, CODIGO, ID_ALERTA, MOTIVO),
      ).resolves.toMatchObject({ estado_resolucion: 'ATENDIDA' });
    },
  );

  it.each(['', '   ', 'corto'])(
    '422 MOTIVO_INVALIDO sin un motivo válido (%j), sin tocar M05 ni la base',
    async (motivo) => {
      await expect(errorDe(motivo)).resolves.toEqual({
        status: 422,
        codigo: 'MOTIVO_INVALIDO',
      });
      expect(obtenerAlerta).not.toHaveBeenCalled();
      expect(registrarAtencion).not.toHaveBeenCalled();
    },
  );

  it('409 ALERTA_YA_ATENDIDA si ya se atendió en M-8', async () => {
    buscarAlertasAtendidas.mockResolvedValue(
      new Map([[ID_ALERTA, new Date('2026-11-21T00:00:00Z')]]),
    );
    await expect(errorDe()).resolves.toEqual({
      status: 409,
      codigo: 'ALERTA_YA_ATENDIDA',
    });
    expect(registrarAtencion).not.toHaveBeenCalled();
  });

  it.each(['ATENDIDA', 'RESUELTA'] as const)(
    '409 ALERTA_YA_ATENDIDA si M05 la informa %s',
    async (estado) => {
      obtenerAlerta.mockResolvedValue(alertaM05(estado));
      await expect(errorDe()).resolves.toEqual({
        status: 409,
        codigo: 'ALERTA_YA_ATENDIDA',
      });
    },
  );

  it.each(['EN_REVISION', 'DESCARTADA'] as const)(
    '409 ALERTA_NO_ACTIVA si M05 la informa %s',
    async (estado) => {
      obtenerAlerta.mockResolvedValue(alertaM05(estado));
      await expect(errorDe()).resolves.toEqual({
        status: 409,
        codigo: 'ALERTA_NO_ACTIVA',
      });
    },
  );

  it('404 ALERTA_NO_ENCONTRADA si M05 no tiene la alerta', async () => {
    obtenerAlerta.mockResolvedValue(null);
    await expect(errorDe()).resolves.toEqual({
      status: 404,
      codigo: 'ALERTA_NO_ENCONTRADA',
    });
  });

  it('404 PARTICIPANTE_NO_ENCONTRADO sin consultar M05', async () => {
    buscarIdParticipante.mockResolvedValue(null);
    await expect(errorDe()).resolves.toEqual({
      status: 404,
      codigo: 'PARTICIPANTE_NO_ENCONTRADO',
    });
    expect(obtenerAlerta).not.toHaveBeenCalled();
  });

  it('409 INCONSISTENCIA_PARTICIPANTE si M05 atribuye la alerta a otro participante', async () => {
    obtenerAlerta.mockResolvedValue(alertaM05('ACTIVA', 'P-00000000'));
    await expect(errorDe()).resolves.toEqual({
      status: 409,
      codigo: 'INCONSISTENCIA_PARTICIPANTE',
    });
  });

  it('503 si M05 no responde', async () => {
    obtenerAlerta.mockRejectedValue(new Error('caído'));
    await expect(errorDe()).resolves.toEqual({
      status: 503,
      codigo: 'M05_NO_DISPONIBLE',
    });
  });

  it('500 con el mensaje de RF-147 FA4 si falla la persistencia o la auditoría', async () => {
    registrarAtencion.mockRejectedValue(new Error('rollback'));
    const error = await useCase
      .execute(ctx, CODIGO, ID_ALERTA, MOTIVO)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GestionAlertaException);
    expect((error as GestionAlertaException).getResponse()).toEqual({
      status: 500,
      codigo: 'ERROR_GESTION_ALERTA',
      mensaje:
        'Error al procesar la solicitud. La operación ha sido cancelada para garantizar la integridad de la auditoría. Por favor, intente nuevamente.',
    });
  });

  it('cada fallo queda en la bitácora como FALLIDA, con el participante y severidad ALTA', async () => {
    obtenerAlerta.mockResolvedValue(alertaM05('RESUELTA'));
    await errorDe();
    expect(registrarIntento).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        accion: 'GESTION_ALERTA',
        recurso: 'ALERTA_PARTICIPANTE',
        idRecurso: ID_ALERTA,
        idParticipante: ID_PARTICIPANTE,
        severidad: 'ALTA',
      }),
      'FALLIDA',
    );
  });
});
