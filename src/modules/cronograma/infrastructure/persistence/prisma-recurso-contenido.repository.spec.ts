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
    modulos_sistema: { findMany: jest.fn() },
    recursos_contenido: { create: jest.fn() },
    recursos_modulos_destino: { createMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(),
  };
  type EjecutarTransaccion = (cliente: typeof tx) => Promise<RecursoContenido>;
  let repository: PrismaRecursoContenidoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: EjecutarTransaccion) =>
      callback(tx),
    );
    tx.modulos_sistema.findMany.mockResolvedValue([
      { id_modulo: idModuloUno },
      { id_modulo: idModuloDos },
    ]);
    tx.recursos_contenido.create.mockResolvedValue(recursoPrisma());
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
