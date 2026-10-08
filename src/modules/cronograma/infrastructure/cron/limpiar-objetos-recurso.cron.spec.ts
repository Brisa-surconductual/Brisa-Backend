import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LimpiarObjetosRecursoCron } from './limpiar-objetos-recurso.cron';

describe('Limpieza reintentable de objetos', () => {
  const tarea = {
    id_limpieza: 1n,
    id_contenido: 'contenido',
    clave_almacenamiento: 'clave',
    intentos: 1,
  };
  const tx = { $queryRaw: jest.fn() };
  const prisma = {
    $transaction: jest.fn(),
    $executeRaw: jest.fn<Promise<number>, [Prisma.Sql]>(),
    recursos_contenido: { findFirst: jest.fn() },
  };
  const almacenamiento = { eliminarObjeto: jest.fn() };
  let cron: LimpiarObjetosRecursoCron;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prisma.$transaction.mockImplementation(
      (callback: (cliente: typeof tx) => Promise<unknown>) => callback(tx),
    );
    tx.$queryRaw.mockResolvedValue([tarea]);
    prisma.recursos_contenido.findFirst.mockResolvedValue(null);
    prisma.$executeRaw.mockResolvedValue(1);
    almacenamiento.eliminarObjeto.mockResolvedValue(undefined);
    cron = new LimpiarObjetosRecursoCron(
      prisma as never,
      almacenamiento as never,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('elimina después de reclamar la tarea y confirma su finalización', async () => {
    await cron.ejecutar();
    expect(almacenamiento.eliminarObjeto).toHaveBeenCalledWith({
      idContenido: 'contenido',
      claveAlmacenamiento: 'clave',
    });
    expect(prisma.$executeRaw.mock.calls[0][0].strings.join('')).toContain(
      "estado = 'COMPLETADO'",
    );
  });

  it('no elimina un objeto aún referenciado', async () => {
    prisma.recursos_contenido.findFirst.mockResolvedValue({
      id_recurso: 'otro',
    });
    await cron.ejecutar();
    expect(almacenamiento.eliminarObjeto).not.toHaveBeenCalled();
  });

  it('reprograma una falla S3 sin revertir la operación original', async () => {
    almacenamiento.eliminarObjeto.mockRejectedValue(
      new Error('AWS no disponible'),
    );
    await cron.ejecutar();
    const consulta = prisma.$executeRaw.mock.calls[0][0];
    expect(consulta.strings.join('')).toContain("estado = 'PENDIENTE'");
    expect(consulta.values).toContain(60);
  });

  it('no llama a S3 sin tareas y tolera una falla al consultar la cola', async () => {
    tx.$queryRaw.mockResolvedValue([]);
    await cron.ejecutar();
    expect(almacenamiento.eliminarObjeto).not.toHaveBeenCalled();
    prisma.$transaction.mockRejectedValue(new Error('BD no disponible'));
    await expect(cron.ejecutar()).resolves.toBeUndefined();
  });
});
