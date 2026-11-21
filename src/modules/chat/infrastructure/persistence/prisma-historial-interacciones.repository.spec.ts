import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaHistorialInteraccionesRepository } from './prisma-historial-interacciones.repository';

describe('PrismaHistorialInteraccionesRepository (RF-31 / RF-32)', () => {
  const findMany = jest.fn();
  const $queryRaw = jest.fn();
  const tx = { interacciones: { findMany }, $queryRaw };
  const $transaction = jest.fn(
    (operacion: (lectura: typeof tx) => Promise<unknown>) => operacion(tx),
  );
  const repositorio = new PrismaHistorialInteraccionesRepository({
    $transaction,
  } as unknown as PrismaService);
  const fecha = new Date('2026-11-20T14:00:00Z');
  const fila = (secuencia: number) => ({
    id_interaccion: `i-${secuencia}`,
    secuencia,
    timestamp_interaccion: fecha,
    id_nodo: `n-${secuencia}`,
    historial_nodos: { id_nodo_destino: `n-${secuencia + 1}` },
    respuestas: [
      { valor_respuesta: secuencia, tipo_entrada: { nombre: 'NUMERICO' } },
    ],
  });

  beforeEach(() => {
    findMany.mockReset();
    $queryRaw.mockReset().mockResolvedValue([{ valido: true }]);
    $transaction.mockClear();
  });

  it('pide una fila extra, informa hay_mas y devuelve la página en orden ascendente', async () => {
    findMany.mockResolvedValue([fila(5), fila(4), fila(3)]);
    const r = await repositorio.consultar({
      idSesion: 's',
      antesDe: 6,
      limite: 2,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_sesion: 's', secuencia: { lt: 6 } },
        orderBy: { secuencia: 'desc' },
        take: 3,
      }),
    );
    expect($transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'RepeatableRead',
    });
    expect(r?.hayMas).toBe(true);
    expect(r?.interacciones.map((i) => i.secuencia)).toEqual([4, 5]);
    expect(r?.interacciones[0]).toEqual({
      idInteraccion: 'i-4',
      secuencia: 4,
      timestampInteraccion: fecha,
      idNodo: 'n-4',
      idNodoDestino: 'n-5',
      tipoEntrada: 'NUMERICO',
      valor: 4,
    });
  });

  it('sin cursor lee las más recientes y admite una página vacía', async () => {
    findMany.mockResolvedValue([]);
    const r = await repositorio.consultar({
      idSesion: 's',
      antesDe: null,
      limite: 20,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_sesion: 's' }, take: 21 }),
    );
    expect(r).toEqual({ hayMas: false, interacciones: [] });
  });

  it('rechaza un historial inconsistente sin leer la página', async () => {
    $queryRaw.mockResolvedValueOnce([{ valido: false }]);
    await expect(
      repositorio.consultar({ idSesion: 's', antesDe: null, limite: 20 }),
    ).resolves.toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('falla si una interacción no tiene respuesta registrada', async () => {
    findMany.mockResolvedValue([{ ...fila(1), respuestas: [] }]);
    await expect(
      repositorio.consultar({ idSesion: 's', antesDe: null, limite: 20 }),
    ).resolves.toBeNull();
  });

  it('falla si un destino histórico carece de una coincidencia única', async () => {
    findMany.mockResolvedValue([{ ...fila(1), historial_nodos: null }]);
    $queryRaw
      .mockResolvedValueOnce([{ valido: true }])
      .mockResolvedValueOnce([]);
    await expect(
      repositorio.consultar({ idSesion: 's', antesDe: null, limite: 20 }),
    ).resolves.toBeNull();
  });
});
