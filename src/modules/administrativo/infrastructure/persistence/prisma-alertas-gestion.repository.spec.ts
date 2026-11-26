import { Prisma } from '@prisma/client';
import { GestionAlertaException } from '../../application/exceptions/gestion-alerta.exception';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { PrismaAlertasGestionRepository } from './prisma-alertas-gestion.repository';

const errorSql = (originalCode: string, originalMessage: string) =>
  new Prisma.PrismaClientKnownRequestError('fallo', {
    code: 'P2010',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { originalCode, originalMessage } } },
  });

describe('PrismaAlertasGestionRepository', () => {
  const repo = new PrismaAlertasGestionRepository();
  const actor: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: null,
    direccionIp: '127.0.0.1',
  };
  const atencion = {
    id_alerta: '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d',
    tipo_alerta: 'INACTIVIDAD' as const,
    id_participante: 'e0000000-0000-4000-8000-000000000003',
    motivo: 'Se contactó al participante.',
  };

  it('devuelve el registro creado por fn_atender_alerta', async () => {
    const fila = {
      id_alerta_gestion: 'g0000000-0000-4000-8000-000000000001',
      fecha_atencion: new Date('2026-11-25T15:00:00Z'),
    };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([fila]),
    } as unknown as Prisma.TransactionClient;
    await expect(repo.registrarAtencion(tx, atencion, actor)).resolves.toEqual(
      fila,
    );
  });

  it.each([
    ['AD409', 'ALERTA_YA_ATENDIDA', 409, 'ALERTA_YA_ATENDIDA'],
    ['23505', 'duplicate key value', 409, 'ALERTA_YA_ATENDIDA'],
    ['AD422', 'MOTIVO_OBLIGATORIO', 422, 'MOTIVO_INVALIDO'],
    ['23514', 'ck_alerta_motivo', 422, 'MOTIVO_INVALIDO'],
    // El constraint trigger diferido: sin bitácora no se confirma la atención.
    ['AD500', 'AUDITORIA_OBLIGATORIA_AUSENTE', 500, 'ERROR_TRANSACCION'],
  ])('traduce %s/%s a %i %s', async (estado, mensaje, status, codigo) => {
    const tx = {
      $queryRaw: jest.fn().mockRejectedValue(errorSql(estado, mensaje)),
    } as unknown as Prisma.TransactionClient;
    const error = await repo
      .registrarAtencion(tx, atencion, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GestionAlertaException);
    expect((error as GestionAlertaException).getStatus()).toBe(status);
    expect((error as GestionAlertaException).codigo).toBe(codigo);
  });

  describe('filtrarNoAtendidas (RF-146)', () => {
    const A1 = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
    const A2 = '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d';

    it('hace un anti-join por lote en una sola consulta', async () => {
      const $queryRaw = jest.fn().mockResolvedValue([{ id: A2 }]);
      const tx = { $queryRaw } as unknown as Prisma.TransactionClient;
      await expect(
        repo.filtrarNoAtendidas(tx, [A1, A2.toUpperCase(), A1]),
      ).resolves.toEqual(new Set([A2]));
      expect($queryRaw).toHaveBeenCalledTimes(1);
      const [plantilla, ids] = $queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        string[],
      ];
      expect(plantilla.join('?')).toContain('NOT EXISTS');
      expect(ids).toEqual([A1, A2]);
    });

    it('un id que no es UUID se considera no atendido sin consultar', async () => {
      const $queryRaw = jest.fn();
      const tx = { $queryRaw } as unknown as Prisma.TransactionClient;
      await expect(repo.filtrarNoAtendidas(tx, ['ALR-1'])).resolves.toEqual(
        new Set(['alr-1']),
      );
      expect($queryRaw).not.toHaveBeenCalled();
    });
  });
});
