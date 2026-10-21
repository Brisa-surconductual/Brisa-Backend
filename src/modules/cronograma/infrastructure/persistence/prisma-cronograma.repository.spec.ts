import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaCronogramaRepository } from './prisma-cronograma.repository';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { CronogramaSinContenidoProgramadoException } from '../../domain/exeption/cronograma/cronograma-sin-contenido-programado.exeption';

describe('Selección segura del cronograma base', () => {
  const findFirst = jest.fn();
  const repository = new PrismaCronogramaRepository({
    cronogramas: { findFirst },
  } as unknown as PrismaService);
  const base = {
    id_cronograma: 'base',
    nombre_cronograma: 'Base',
    estado: 'ACTIVO',
    es_base: true,
    fecha_activacion: new Date(),
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  };
  beforeEach(() => jest.resetAllMocks());
  it('no asigna un base activo sin unidades aunque provenga de datos históricos', async () => {
    findFirst.mockResolvedValue({ ...base, unidades_temporales: [] });
    await expect(repository.buscarBaseActiva()).rejects.toBeInstanceOf(
      CronogramaSinUnidadesTemporalesException,
    );
  });
  it('no asigna un base sin contenidos', async () => {
    findFirst.mockResolvedValue({
      ...base,
      unidades_temporales: [{ _count: { contenidos_cronograma: 0 } }],
    });
    await expect(repository.buscarBaseActiva()).rejects.toBeInstanceOf(
      CronogramaSinContenidoProgramadoException,
    );
  });
  it('reutiliza un base activo con planificación', async () => {
    findFirst.mockResolvedValue({
      ...base,
      unidades_temporales: [{ _count: { contenidos_cronograma: 1 } }],
    });
    await expect(repository.buscarBaseActiva()).resolves.toMatchObject({
      id_cronograma: 'base',
      estado: 'ACTIVO',
    });
  });
  it('conserva la ausencia de base activo como null', async () => {
    findFirst.mockResolvedValue(null);
    await expect(repository.buscarBaseActiva()).resolves.toBeNull();
  });
});
