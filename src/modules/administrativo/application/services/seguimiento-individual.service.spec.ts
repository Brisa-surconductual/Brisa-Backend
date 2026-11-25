import type { Prisma } from '@prisma/client';
import { SeguimientoIndividualException } from '../exceptions/seguimiento-individual.exception';
import { SeguimientoIndividualService } from './seguimiento-individual.service';

describe('SeguimientoIndividualService', () => {
  const tx = {} as Prisma.TransactionClient;
  const buscarAlertasAtendidas = jest.fn<
    Promise<Map<string, Date>>,
    [Prisma.TransactionClient, string, string[]]
  >();
  const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';
  const servicio = new SeguimientoIndividualService({
    buscarIdParticipante: jest.fn(),
    buscarAlertasAtendidas,
  });

  beforeEach(() => {
    buscarAlertasAtendidas.mockReset().mockResolvedValue(new Map());
  });

  describe('validarPertenencia', () => {
    it('acepta datos del participante solicitado', () => {
      expect(() =>
        servicio.validarPertenencia('P-7F3A91C2', 'P-7F3A91C2'),
      ).not.toThrow();
    });

    it('lanza 409 INCONSISTENCIA_PARTICIPANTE si M05 devuelve otro participante', () => {
      const error = (() => {
        try {
          servicio.validarPertenencia('P-00000000', 'P-7F3A91C2');
        } catch (e) {
          return e as SeguimientoIndividualException;
        }
      })();
      expect(error).toBeInstanceOf(SeguimientoIndividualException);
      expect(error?.getStatus()).toBe(409);
      expect(error?.getResponse()).toEqual({
        status: 409,
        codigo: 'INCONSISTENCIA_PARTICIPANTE',
        mensaje: 'No fue posible mostrar la información solicitada.',
      });
    });
  });

  describe('resolverEstados', () => {
    it('prioridad 1: ATENDIDA si la alerta figura en alertas_gestion_admin', async () => {
      buscarAlertasAtendidas.mockResolvedValue(
        new Map([['a1', new Date('2026-11-13T09:00:00Z')]]),
      );

      const [alerta] = await servicio.resolverEstados(tx, ID_PARTICIPANTE, [
        {
          id_alerta: 'a1',
          estado_resolucion: 'ACTIVA',
          fecha_resolucion: null,
        },
      ]);

      expect(alerta).toEqual({
        id_alerta: 'a1',
        estado_resolucion: 'ATENDIDA',
        fecha_resolucion: '2026-11-13T09:00:00.000Z',
      });
    });

    it('prioridad 2: el estado de M05 si no está en la tabla local', async () => {
      const [alerta] = await servicio.resolverEstados(tx, ID_PARTICIPANTE, [
        {
          id_alerta: 'a2',
          estado_resolucion: 'RESUELTA',
          fecha_resolucion: '2026-11-15T10:00:00Z',
        },
      ]);

      expect(alerta).toMatchObject({
        estado_resolucion: 'RESUELTA',
        fecha_resolucion: '2026-11-15T10:00:00Z',
      });
    });

    it('prioridad 3: ACTIVA si M05 no informa estado', async () => {
      const [alerta] = await servicio.resolverEstados(tx, ID_PARTICIPANTE, [
        { id_alerta: 'a3' },
      ]);

      expect(alerta).toEqual({
        id_alerta: 'a3',
        estado_resolucion: 'ACTIVA',
        fecha_resolucion: null,
      });
    });

    it('consulta la tabla local una sola vez con todos los ids y conserva los demás campos', async () => {
      buscarAlertasAtendidas.mockResolvedValue(
        new Map([['a2', new Date('2026-11-20T00:00:00Z')]]),
      );

      const alertas = await servicio.resolverEstados(tx, ID_PARTICIPANTE, [
        { id_alerta: 'a1', tipo_alerta: 'INACTIVIDAD' },
        { id_alerta: 'a2', tipo_alerta: 'CRAVING_ELEVADO' },
      ]);

      expect(buscarAlertasAtendidas).toHaveBeenCalledTimes(1);
      expect(buscarAlertasAtendidas).toHaveBeenCalledWith(tx, ID_PARTICIPANTE, [
        'a1',
        'a2',
      ]);
      expect(alertas.map((a) => [a.tipo_alerta, a.estado_resolucion])).toEqual([
        ['INACTIVIDAD', 'ACTIVA'],
        ['CRAVING_ELEVADO', 'ATENDIDA'],
      ]);
    });

    it('no consulta la tabla local si no hay alertas', async () => {
      await expect(
        servicio.resolverEstados(tx, ID_PARTICIPANTE, []),
      ).resolves.toEqual([]);
      expect(buscarAlertasAtendidas).not.toHaveBeenCalled();
    });
  });

  describe('estaAtendida', () => {
    it('consulta solo las alertas del participante', async () => {
      buscarAlertasAtendidas.mockResolvedValue(
        new Map([['a1', new Date('2026-11-13T09:00:00Z')]]),
      );
      await expect(
        servicio.estaAtendida(tx, ID_PARTICIPANTE, 'a1'),
      ).resolves.toBe(true);
      await expect(
        servicio.estaAtendida(tx, ID_PARTICIPANTE, 'a2'),
      ).resolves.toBe(false);
      expect(buscarAlertasAtendidas).toHaveBeenCalledWith(tx, ID_PARTICIPANTE, [
        'a2',
      ]);
    });
  });
});
