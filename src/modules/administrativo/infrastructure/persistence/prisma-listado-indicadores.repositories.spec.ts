import type { Prisma } from '@prisma/client';
import { PrismaParticipantesCohorteRepository } from './prisma-participantes-cohorte.repository';
import { PrismaSeguimientoIndividualRepository } from './prisma-seguimiento-individual.repository';

const COHORTE = 'c0000000-0000-4000-8000-000000000001';
const P1 = 'e0000000-0000-4000-8000-000000000001';
const P2 = 'e0000000-0000-4000-8000-000000000002';
const A1 = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const A2 = '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d';

describe('Consultas por lote del listado de indicadores (RF-142)', () => {
  describe('PrismaParticipantesCohorteRepository.listarActivos', () => {
    it('lee las membresías ACTIVO con su seudónimo en una sola consulta', async () => {
      const filas = [{ id_usuario: P1, codigo_participante: 'P-AAAAAAAA' }];
      const $queryRaw = jest.fn().mockResolvedValue(filas);
      const tx = { $queryRaw } as unknown as Prisma.TransactionClient;

      await expect(
        new PrismaParticipantesCohorteRepository().listarActivos(tx, COHORTE),
      ).resolves.toEqual(filas);

      expect($queryRaw).toHaveBeenCalledTimes(1);
      const [consulta] = $queryRaw.mock.calls[0] as [Prisma.Sql];
      expect(consulta.sql).toContain("cp.estado = 'ACTIVO'");
      expect(consulta.sql).toContain('seudonimos_participante');
      // Sin la vista de validación (LATERAL por fila).
      expect(consulta.sql).not.toContain('v_cohorte_participantes_validacion');
      expect(consulta.values).toEqual([COHORTE]);
    });
  });

  describe('PrismaSeguimientoIndividualRepository.buscarAlertasAtendidasLote', () => {
    const repo = new PrismaSeguimientoIndividualRepository();

    it('consulta una sola vez para todos y devuelve claves participante:alerta en minúsculas', async () => {
      const $queryRaw = jest
        .fn()
        .mockResolvedValue([{ id_participante: P1, id_alerta_externo: A2 }]);
      const tx = { $queryRaw } as unknown as Prisma.TransactionClient;

      await expect(
        repo.buscarAlertasAtendidasLote(
          tx,
          [P1, P2, P1],
          [A1, A2.toUpperCase(), 'no-uuid'],
        ),
      ).resolves.toEqual(new Set([`${P1}:${A2}`]));

      expect($queryRaw).toHaveBeenCalledTimes(1);
      const [, participantes, alertas] = $queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        string[],
        string[],
      ];
      expect(participantes).toEqual([P1, P2]);
      // El id que no es UUID se descarta antes del cast.
      expect(alertas).toEqual([A1, A2.toUpperCase()]);
    });

    it('no consulta si no hay ids válidos', async () => {
      const $queryRaw = jest.fn();
      const tx = { $queryRaw } as unknown as Prisma.TransactionClient;
      await expect(
        repo.buscarAlertasAtendidasLote(tx, [P1], ['no-uuid']),
      ).resolves.toEqual(new Set());
      await expect(
        repo.buscarAlertasAtendidasLote(tx, [], [A1]),
      ).resolves.toEqual(new Set());
      expect($queryRaw).not.toHaveBeenCalled();
    });
  });
});
