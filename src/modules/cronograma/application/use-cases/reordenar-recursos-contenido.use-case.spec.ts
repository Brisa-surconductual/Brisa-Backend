import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { ReordenarRecursosContenidoUseCase } from './reordenar-recursos-contenido.use-case';

describe('ReordenarRecursosContenidoUseCase (RF-153)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const idRecursos = [
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
  ];
  let contenidoRepository: jest.Mocked<ContenidoRepository>;
  let recursoRepository: jest.Mocked<RecursoContenidoRepository>;
  let useCase: ReordenarRecursosContenidoUseCase;

  beforeEach(() => {
    contenidoRepository = {
      crear: jest.fn(),
      buscarPorId: jest
        .fn()
        .mockResolvedValue(
          new Contenido(
            idContenido,
            'Contenido',
            TipoContenido.MIXTO,
            new Date(),
            new Date(),
          ),
        ),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
    };
    recursoRepository = {
      crearConModulosDestino: jest.fn(),
      reordenar: jest.fn(),
    };
    useCase = new ReordenarRecursosContenidoUseCase(
      contenidoRepository,
      recursoRepository,
    );
  });

  it('delega el nuevo orden completo del contenido', async () => {
    await expect(
      useCase.execute(idContenido, { id_recursos: idRecursos }),
    ).resolves.toEqual({
      mensaje: 'Orden de los recursos actualizado correctamente.',
    });
    expect(recursoRepository.reordenar.mock.calls).toEqual([
      [idContenido, idRecursos],
    ]);
  });

  it('retorna 404 cuando el contenido no existe', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.execute(idContenido, { id_recursos: idRecursos }),
    ).rejects.toMatchObject({ status: 404 });
    expect(recursoRepository.reordenar.mock.calls).toHaveLength(0);
  });
});
