import { PrismaModuloSistemaRepository } from './prisma-modulo-sistema.repository';

describe('PrismaModuloSistemaRepository (RF-154)', () => {
  it('consulta solo módulos activos ordenados por nombre', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id_modulo: '00000000-0000-4000-8000-000000000003',
        codigo_modulo: 'CHAT',
        nombre_modulo: 'Chat',
      },
    ]);
    const repository = new PrismaModuloSistemaRepository({
      modulos_sistema: { findMany },
    } as never);

    await expect(repository.listarActivos()).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { activo: true },
      orderBy: { nombre_modulo: 'asc' },
      select: {
        id_modulo: true,
        codigo_modulo: true,
        nombre_modulo: true,
      },
    });
  });

  it('RF-21 busca el código únicamente entre módulos activos', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id_modulo: '00000000-0000-4000-8000-000000000003',
      codigo_modulo: 'CHAT',
      nombre_modulo: 'Chat',
    });
    const repository = new PrismaModuloSistemaRepository({
      modulos_sistema: { findFirst },
    } as never);

    await expect(repository.buscarActivoPorCodigo('CHAT')).resolves.toEqual(
      expect.objectContaining({ codigo_modulo: 'CHAT' }),
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: { codigo_modulo: 'CHAT', activo: true },
      select: {
        id_modulo: true,
        codigo_modulo: true,
        nombre_modulo: true,
      },
    });
  });
});
