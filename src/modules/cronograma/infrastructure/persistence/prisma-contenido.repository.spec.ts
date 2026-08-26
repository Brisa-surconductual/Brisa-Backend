import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { PrismaContenidoRepository } from './prisma-contenido.repository';

describe('PrismaContenidoRepository (RF-152)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const prisma = {
    contenidos: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  let repository: PrismaContenidoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaContenidoRepository(prisma as never);
  });

  it.each(['actualizar', 'eliminar'] as const)(
    'traduce a HTTP 409 el trigger al %s',
    async (operacion) => {
      const errorTrigger = {
        code: 'P2004',
        meta: {
          database_error:
            'trg_contenido_bloqueo_cronograma_activo: operación bloqueada',
        },
      };
      prisma.contenidos[
        operacion === 'actualizar' ? 'update' : 'delete'
      ].mockRejectedValue(errorTrigger);

      const resultado =
        operacion === 'actualizar'
          ? repository.actualizar(contenido())
          : repository.eliminar(idContenido);

      await expect(resultado).rejects.toMatchObject({
        status: 409,
        message:
          'No se puede modificar un contenido asociado a un cronograma activo.',
      });
    },
  );

  it('traduce una carrera por contenido inexistente a HTTP 404', async () => {
    prisma.contenidos.update.mockRejectedValue({ code: 'P2025' });

    await expect(repository.actualizar(contenido())).rejects.toMatchObject({
      status: 404,
    });
  });

  it('no oculta fallos inesperados de persistencia', async () => {
    const error = new Error('database unavailable');
    prisma.contenidos.delete.mockRejectedValue(error);

    await expect(repository.eliminar(idContenido)).rejects.toBe(error);
  });

  function contenido(): Contenido {
    return new Contenido(
      idContenido,
      'Contenido de prueba',
      TipoContenido.INFORMATIVO,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-02T00:00:00.000Z'),
    );
  }
});
