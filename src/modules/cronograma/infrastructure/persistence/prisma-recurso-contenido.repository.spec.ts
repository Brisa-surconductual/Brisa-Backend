import { Prisma } from '@prisma/client';
import { RecursoContenido } from '../../domain/entities/recurso-contenido.entity';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { PrismaRecursoContenidoRepository } from './prisma-recurso-contenido.repository';

describe('PrismaRecursoContenidoRepository (RF-153/RF-154)', () => {
  const idRecurso = '00000000-0000-4000-8000-000000000001';
  const idContenido = '00000000-0000-4000-8000-000000000002';
  const idModuloUno = '00000000-0000-4000-8000-000000000003';
  const idModuloDos = '00000000-0000-4000-8000-000000000004';
  const tx = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    contenidos_cronograma: { findFirst: jest.fn() },
    modulos_sistema: { findMany: jest.fn(), count: jest.fn() },
    recursos_contenido: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    recursos_modulos_destino: { createMany: jest.fn(), deleteMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(),
  };
  type EjecutarTransaccion = (cliente: typeof tx) => Promise<unknown>;
  let repository: PrismaRecursoContenidoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    tx.$queryRaw.mockResolvedValue([{ id_contenido: idContenido }]);
    tx.contenidos_cronograma.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback: EjecutarTransaccion) =>
      callback(tx),
    );
    tx.modulos_sistema.findMany.mockResolvedValue([
      { id_modulo: idModuloUno },
      { id_modulo: idModuloDos },
    ]);
    tx.recursos_contenido.create.mockResolvedValue(recursoPrisma());
    tx.recursos_contenido.findMany.mockResolvedValue([
      { id_recurso: idRecurso },
      { id_recurso: idModuloDos },
    ]);
    tx.recursos_contenido.update.mockResolvedValue({});
    tx.recursos_modulos_destino.createMany.mockResolvedValue({ count: 2 });
    repository = new PrismaRecursoContenidoRepository(prisma as never);
  });

  it('inserta el recurso y todos sus módulos dentro de la misma transacción', async () => {
    const resultado = await repository.crearConModulosDestino(recurso(), [
      idModuloUno,
      idModuloDos,
    ]);

    expect(prisma.$transaction.mock.calls).toHaveLength(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.recursos_contenido.create.mock.calls).toHaveLength(1);
    expect(tx.recursos_modulos_destino.createMany).toHaveBeenCalledWith({
      data: [
        { id_recurso: idRecurso, id_modulo: idModuloUno },
        { id_recurso: idRecurso, id_modulo: idModuloDos },
      ],
    });
    expect(resultado.id_recurso).toBe(idRecurso);
  });

  it('retorna 404 y no inserta el recurso si falta un módulo activo', async () => {
    tx.modulos_sistema.findMany.mockResolvedValue([{ id_modulo: idModuloUno }]);

    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno, idModuloDos]),
    ).rejects.toMatchObject({ status: 404 });
    expect(tx.recursos_contenido.create.mock.calls).toHaveLength(0);
    expect(tx.recursos_modulos_destino.createMany.mock.calls).toHaveLength(0);
  });

  it('traduce el orden duplicado a HTTP 409', async () => {
    prisma.$transaction.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['id_contenido', 'orden_bloque'] },
    });

    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno]),
    ).rejects.toMatchObject({
      status: 409,
      message: 'El orden del bloque ya está asignado dentro del contenido.',
    });
  });

  it('traduce el fallo diferido del trigger a HTTP 400', async () => {
    prisma.$transaction.mockRejectedValue({
      code: 'P2004',
      meta: {
        driverAdapterError: {
          cause: {
            originalMessage:
              'El recurso debe tener al menos un módulo destino asignado.',
          },
        },
      },
    });

    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno]),
    ).rejects.toMatchObject({
      status: 400,
      message: 'El recurso debe tener al menos un módulo destino asignado.',
    });
  });

  it('traduce la restricción de coherencia a HTTP 400', async () => {
    prisma.$transaction.mockRejectedValue({
      code: 'P2004',
      meta: { constraint: 'ck_recurso_coherente' },
    });

    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno]),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('no oculta un fallo inesperado de la transacción', async () => {
    const error = new Error('database unavailable');
    prisma.$transaction.mockRejectedValue(error);

    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno]),
    ).rejects.toBe(error);
  });

  it('reordena todos los recursos en dos fases dentro de una transacción', async () => {
    await repository.reordenar(idContenido, [idModuloDos, idRecurso]);

    expect(tx.recursos_contenido.update.mock.calls).toEqual([
      [
        {
          where: { id_recurso: idModuloDos },
          data: { orden_bloque: -1 },
        },
      ],
      [
        {
          where: { id_recurso: idRecurso },
          data: { orden_bloque: -2 },
        },
      ],
      [
        {
          where: { id_recurso: idModuloDos },
          data: { orden_bloque: 1 },
        },
      ],
      [
        {
          where: { id_recurso: idRecurso },
          data: { orden_bloque: 2 },
        },
      ],
    ]);
  });

  it('rechaza un orden parcial o con recursos ajenos', async () => {
    await expect(
      repository.reordenar(idContenido, [idRecurso]),
    ).rejects.toMatchObject({ status: 400 });
    expect(tx.recursos_contenido.update.mock.calls).toHaveLength(0);
  });

  it('rechaza modificación y eliminación de contenido activo sin escribir', async () => {
    tx.recursos_contenido.findUnique.mockResolvedValue(recursoPrisma());
    tx.contenidos_cronograma.findFirst.mockResolvedValue({
      id_contenido_cronograma: idContenido,
    });
    await expect(
      repository.actualizar(idRecurso, { textoContenido: 'Nuevo' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(repository.eliminar(idRecurso)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      repository.crearConModulosDestino(recurso(), [idModuloUno]),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      repository.reordenar(idContenido, [idRecurso, idModuloDos]),
    ).rejects.toMatchObject({ status: 403 });
    expect(tx.recursos_contenido.update).not.toHaveBeenCalled();
    expect(tx.recursos_contenido.delete).not.toHaveBeenCalled();
  });

  it('devuelve 404 para un recurso inexistente', async () => {
    tx.recursos_contenido.findUnique.mockResolvedValue(null);
    await expect(repository.eliminar(idRecurso)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('reemplaza todos los destinos y conserva los campos omitidos', async () => {
    tx.recursos_contenido.findUnique.mockResolvedValue(recursoPrisma());
    tx.modulos_sistema.count.mockResolvedValue(1);
    tx.recursos_contenido.update.mockResolvedValue({
      ...recursoPrisma(),
      recursos_modulos_destino: [{ id_modulo: idModuloDos }],
    });
    const resultado = await repository.actualizar(idRecurso, {
      idModulos: [idModuloDos],
    });
    expect(resultado.idModulos).toEqual([idModuloDos]);
    expect(resultado.recurso.texto_contenido).toBe('Texto educativo');
    expect(tx.recursos_modulos_destino.deleteMany).toHaveBeenCalledWith({
      where: { id_recurso: idRecurso },
    });
    expect(tx.recursos_modulos_destino.createMany).toHaveBeenCalledWith({
      data: [{ id_recurso: idRecurso, id_modulo: idModuloDos }],
    });
  });

  it('impide dejar recursos sin destinos o con destinos inactivos', async () => {
    tx.recursos_contenido.findUnique.mockResolvedValue(recursoPrisma());
    await expect(
      repository.actualizar(idRecurso, { idModulos: [] }),
    ).rejects.toMatchObject({ status: 400 });
    tx.modulos_sistema.count.mockResolvedValue(0);
    await expect(
      repository.actualizar(idRecurso, { idModulos: [idModuloUno] }),
    ).rejects.toMatchObject({ status: 404 });
    expect(tx.recursos_modulos_destino.deleteMany).not.toHaveBeenCalled();
  });

  it('compacta el orden al eliminar y no toca recursos de otro contenido', async () => {
    tx.recursos_contenido.findUnique.mockResolvedValue(recursoPrisma());
    tx.recursos_contenido.findMany.mockResolvedValue([
      { id_recurso: idModuloDos },
    ]);
    await repository.eliminar(idRecurso);
    expect(tx.recursos_contenido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_contenido: idContenido } }),
    );
    expect(tx.recursos_contenido.update).toHaveBeenLastCalledWith({
      where: { id_recurso: idModuloDos },
      data: { orden_bloque: 1 },
    });
  });

  it.each([
    { code: 'P2002', meta: { target: ['clave_almacenamiento'] } },
    { code: 'P2034' },
    { code: 'P2004', meta: { constraint: 'ck_recurso_clave_retirada' } },
  ])(
    'traduce conflictos de archivo y concurrencia a 409: %p',
    async (error) => {
      prisma.$transaction.mockRejectedValue(error);
      await expect(repository.eliminar(idRecurso)).rejects.toMatchObject({
        status: 409,
      });
    },
  );

  function recurso(): RecursoContenido {
    return new RecursoContenido(
      idRecurso,
      idContenido,
      TipoRecurso.TEXTO,
      1,
      'Texto educativo',
      null,
      null,
      null,
      null,
      null,
      new Date('2026-08-01T00:00:00.000Z'),
    );
  }

  function recursoPrisma() {
    return {
      id_recurso: idRecurso,
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.TEXTO,
      orden_bloque: 1,
      texto_contenido: 'Texto educativo',
      clave_almacenamiento: null,
      mime_type: null,
      tamano_bytes: null,
      duracion_segundos: null,
      texto_alternativo: null,
      fecha_creacion: new Date('2026-08-01T00:00:00.000Z'),
    };
  }
});
