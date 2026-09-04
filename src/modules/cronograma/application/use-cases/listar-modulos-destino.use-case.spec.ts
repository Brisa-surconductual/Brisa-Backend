import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { ListarModulosDestinoUseCase } from './listar-modulos-destino.use-case';

describe('ListarModulosDestinoUseCase (RF-154)', () => {
  it('expone únicamente los datos necesarios para seleccionar el módulo', async () => {
    const repository: jest.Mocked<ModuloSistemaRepository> = {
      listarActivos: jest
        .fn()
        .mockResolvedValue([
          new ModuloSistema(
            '00000000-0000-4000-8000-000000000003',
            'CHAT',
            'Chat',
          ),
        ]),
    };
    const useCase = new ListarModulosDestinoUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual([
      {
        id_modulo: '00000000-0000-4000-8000-000000000003',
        codigo_modulo: 'CHAT',
        nombre_modulo: 'Chat',
      },
    ]);
  });
});
