import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaContenidoCronogramaRepository } from './primsa-contenido-cronograma.repository';
import { ContenidoCronograma } from '../../domain/entities/contenido-cronograma.entity';
describe('Bloqueo transaccional de programación de cronogramas activos', () => {
  const tx = {
    $queryRaw: jest.fn(),
    contenidos_cronograma: {
      findUnique: jest.fn().mockResolvedValue({ id_unidad_temporal: 'unidad' }),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const repository = new PrismaContenidoCronogramaRepository({
    $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
  } as unknown as PrismaService);
  beforeEach(() => {
    jest.clearAllMocks();
    tx.$queryRaw.mockResolvedValue([{ estado: 'ACTIVO' }]);
  });
  it.each(['crear', 'actualizar', 'eliminar'] as const)(
    'rechaza %s sin escribir',
    async (action) => {
      const result =
        action === 'crear'
          ? repository.crearConReordenamiento(
              ContenidoCronograma.crear(
                'contenido',
                'unidad',
                1,
                new Date(),
                new Date(),
              ),
              [],
            )
          : action === 'actualizar'
            ? repository.actualizarDisponibilidad(
                'asociacion',
                new Date(),
                new Date(),
              )
            : repository.eliminar('asociacion');
      await expect(result).rejects.toMatchObject({ status: 409 });
      expect(tx.contenidos_cronograma.create).not.toHaveBeenCalled();
      expect(tx.contenidos_cronograma.update).not.toHaveBeenCalled();
      expect(tx.contenidos_cronograma.deleteMany).not.toHaveBeenCalled();
    },
  );
});
