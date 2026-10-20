import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaActivacionCronogramaRepository } from './prisma-activacion-cronograma.repository';
import { ValidarConsistenciaCronogramaService } from '../../application/service/validad-consistencia-global-cronograma.service';
import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';

// Las transacciones y el índice parcial también se verifican sobre PostgreSQL local.
describe('Activación transaccional del cronograma base', () => {
  const fecha = new Date('2026-01-01');
  const registro = {
    id_cronograma: 'nuevo',
    nombre_cronograma: 'Nuevo base',
    estado: EstadoCronograma.INACTIVO,
    es_base: true,
    fecha_creacion: fecha,
    fecha_actualizacion: fecha,
    fecha_activacion: fecha,
    unidades_temporales: [
      {
        id_unidad_temporal: 'unidad',
        orden_unidad: 1,
        fecha_inicio: fecha,
        fecha_fin: new Date('2026-01-08'),
        contenidos_cronograma: [
          {
            contenidos: {
              nombre_contenido: 'Completo',
              recursos_contenido: [
                {
                  recursos_modulos_destino: [
                    { modulos_sistema: { activo: true } },
                  ],
                },
              ],
            },
            orden_contenido: 1,
            fecha_inicio_disponibilidad: fecha,
            fecha_fin_disponibilidad: new Date('2026-01-07'),
          },
        ],
      },
    ],
  };
  let tx: {
    cronogramas: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let transaction: jest.Mock;
  let repository: PrismaActivacionCronogramaRepository;
  const validador = new ValidarConsistenciaCronogramaService();
  beforeEach(() => {
    tx = {
      cronogramas: {
        findUnique: jest.fn().mockResolvedValue(registro),
        updateMany: jest.fn(),
        update: jest
          .fn()
          .mockResolvedValue({ ...registro, estado: EstadoCronograma.ACTIVO }),
      },
    };
    transaction = jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );
    repository = new PrismaActivacionCronogramaRepository({
      $transaction: transaction,
    } as unknown as PrismaService);
  });
  it('valida antes de reemplazar el base y activa con aislamiento serializable', async () => {
    await repository.activar('nuevo', (estructura) =>
      validador.validar(estructura),
    );
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    const [cambioBase] = tx.cronogramas.updateMany.mock.calls[0] as [
      {
        where: unknown;
        data: { es_base: boolean; fecha_actualizacion: Date };
      },
    ];
    expect(cambioBase.where).toEqual({
      es_base: true,
      estado: 'ACTIVO',
      id_cronograma: { not: 'nuevo' },
    });
    expect(cambioBase.data.es_base).toBe(false);
    expect(cambioBase.data.fecha_actualizacion).toBeInstanceOf(Date);
    const [cambioEstado] = tx.cronogramas.update.mock.calls[0] as [
      {
        data: {
          estado: string;
          fecha_activacion: Date;
          fecha_actualizacion: Date;
        };
      },
    ];
    expect(cambioEstado.data.estado).toBe('ACTIVO');
    expect(cambioEstado.data.fecha_activacion).toBeInstanceOf(Date);
    expect(cambioEstado.data.fecha_actualizacion).toBeInstanceOf(Date);
  });
  it('no modifica el base anterior cuando falla la validación', async () => {
    tx.cronogramas.findUnique.mockResolvedValue({
      ...registro,
      unidades_temporales: [],
    });
    await expect(
      repository.activar('nuevo', (estructura) =>
        validador.validar(estructura),
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(tx.cronogramas.updateMany).not.toHaveBeenCalled();
    expect(tx.cronogramas.update).not.toHaveBeenCalled();
  });
  it('no cambia el base al activar un cronograma estándar', async () => {
    tx.cronogramas.findUnique.mockResolvedValue({
      ...registro,
      es_base: false,
    });
    await repository.activar('nuevo', (estructura) =>
      validador.validar(estructura),
    );
    expect(tx.cronogramas.updateMany).not.toHaveBeenCalled();
  });
  it('retorna 404 si no existe', async () => {
    tx.cronogramas.findUnique.mockResolvedValue(null);
    await expect(repository.activar('nuevo', jest.fn())).rejects.toMatchObject({
      status: 404,
    });
  });
  it('reintenta las colisiones serializables', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    await repository.activar('nuevo', (estructura) =>
      validador.validar(estructura),
    );
    expect(transaction).toHaveBeenCalledTimes(2);
  });
  it('traduce una colisión de índice a 409 y limita reintentos', async () => {
    transaction.mockRejectedValue({ code: 'P2034' });
    await expect(repository.activar('nuevo', jest.fn())).rejects.toMatchObject({
      status: 409,
    });
    expect(transaction).toHaveBeenCalledTimes(3);
    transaction.mockRejectedValue({ code: 'P2002' });
    await expect(repository.activar('nuevo', jest.fn())).rejects.toMatchObject({
      status: 409,
    });
  });
});
