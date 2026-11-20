import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaHistorialInteraccionesRepository } from './prisma-historial-interacciones.repository';

describe('PrismaHistorialInteraccionesRepository (RF-31 / RF-32)', () => {
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const repositorio = new PrismaHistorialInteraccionesRepository({
    interacciones: { findFirst, findMany },
  } as unknown as PrismaService);
  const fecha = new Date('2026-11-20T14:00:00Z');
  const fila = (secuencia: number) => ({
    id_interaccion: `i-${secuencia}`,
    secuencia,
    timestamp_interaccion: fecha,
    fecha_creacion: fecha,
    id_nodo: `n-${secuencia}`,
    respuestas: [
      { valor_respuesta: secuencia, tipo_entrada: { nombre: 'NUMERICO' } },
    ],
  });

  beforeEach(() => {
    findFirst.mockReset().mockResolvedValue({ secuencia: 9 });
    findMany.mockReset();
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
    expect(r.ultimaSecuencia).toBe(9);
    expect(r.hayMas).toBe(true);
    expect(r.interacciones.map((i) => i.secuencia)).toEqual([4, 5]);
    expect(r.interacciones[0]).toEqual({
      idInteraccion: 'i-4',
      secuencia: 4,
      timestampInteraccion: fecha,
      registradaEn: fecha,
      idNodo: 'n-4',
      tipoEntrada: 'NUMERICO',
      valor: 4,
    });
  });

  it('sin antes_de lee las más recientes y sin interacciones devuelve secuencia 0', async () => {
    findFirst.mockResolvedValue(null);
    findMany.mockResolvedValue([]);
    const r = await repositorio.consultar({
      idSesion: 's',
      antesDe: null,
      limite: 20,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_sesion: 's' }, take: 21 }),
    );
    expect(r).toEqual({ ultimaSecuencia: 0, hayMas: false, interacciones: [] });
  });

  it('falla si una interacción no tiene respuesta registrada', async () => {
    findMany.mockResolvedValue([{ ...fila(1), respuestas: [] }]);
    await expect(
      repositorio.consultar({ idSesion: 's', antesDe: null, limite: 20 }),
    ).rejects.toThrow();
  });
});
