import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { ContenidoCronogramaActivoException } from '../../domain/exeption/contenido-cronograma-activo.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { ActualizarContenidoUseCase } from './actualizar-contenido.use-case';
import { CrearContenidoUseCase } from './crear-contenido.use-case';
import { EliminarContenidoUseCase } from './eliminar-contenido.use-case';

describe('Casos de uso de contenido psicoeducativo (RF-152)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  let contenidoRepository: jest.Mocked<ContenidoRepository>;

  beforeEach(() => {
    contenidoRepository = {
      crear: jest.fn(),
      buscarPorId: jest.fn(),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
    };
  });

  it('crea el contenido y lo deja disponible inmediatamente', async () => {
    contenidoRepository.crear.mockImplementation((contenido) =>
      Promise.resolve(contenido),
    );
    const useCase = new CrearContenidoUseCase(contenidoRepository);

    const resultado = await useCase.execute({
      nombre_contenido: 'Prevención del consumo',
      tipo_contenido: TipoContenido.INFORMATIVO,
    });

    expect(contenidoRepository.crear.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        nombre_contenido: 'Prevención del consumo',
        tipo_contenido: TipoContenido.INFORMATIVO,
      }),
    );
    expect(resultado).toMatchObject({
      nombre_contenido: 'Prevención del consumo',
      tipo_contenido: TipoContenido.INFORMATIVO,
      mensaje: 'Contenido psicoeducativo creado correctamente.',
    });
    expect(resultado.id_contenido).toEqual(expect.any(String));
  });

  it('actualiza solo los campos proporcionados', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(contenidoExistente());
    contenidoRepository.actualizar.mockImplementation((contenido) =>
      Promise.resolve(contenido),
    );
    const useCase = new ActualizarContenidoUseCase(contenidoRepository);

    const resultado = await useCase.execute(idContenido, {
      nombre_contenido: 'Contenido actualizado',
    });

    expect(contenidoRepository.actualizar.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id_contenido: idContenido,
        nombre_contenido: 'Contenido actualizado',
        tipo_contenido: TipoContenido.ACTIVIDAD,
      }),
    );
    expect(resultado.nombre_contenido).toBe('Contenido actualizado');
  });

  it('retorna 400 cuando no se indica ningún campo para actualizar', async () => {
    const useCase = new ActualizarContenidoUseCase(contenidoRepository);

    await expect(useCase.execute(idContenido, {})).rejects.toMatchObject({
      status: 400,
    });
    expect(contenidoRepository.buscarPorId.mock.calls).toHaveLength(0);
  });

  it('retorna 404 al actualizar un contenido inexistente', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(null);
    const useCase = new ActualizarContenidoUseCase(contenidoRepository);

    await expect(
      useCase.execute(idContenido, {
        tipo_contenido: TipoContenido.MULTIMEDIA,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('retorna 404 al eliminar un contenido inexistente', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(null);
    const useCase = new EliminarContenidoUseCase(contenidoRepository);

    await expect(useCase.execute(idContenido)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('conserva el 409 generado por el bloqueo de un cronograma activo', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(contenidoExistente());
    contenidoRepository.actualizar.mockRejectedValue(
      new ContenidoCronogramaActivoException(),
    );
    const useCase = new ActualizarContenidoUseCase(contenidoRepository);

    await expect(
      useCase.execute(idContenido, {
        tipo_contenido: TipoContenido.MULTIMEDIA,
      }),
    ).rejects.toMatchObject({
      status: 409,
      message:
        'No se puede modificar un contenido asociado a un cronograma activo.',
    });
  });

  it('elimina un contenido permitido por la base de datos', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(contenidoExistente());
    const useCase = new EliminarContenidoUseCase(contenidoRepository);

    const resultado = await useCase.execute(idContenido);

    expect(contenidoRepository.eliminar.mock.calls).toEqual([[idContenido]]);
    expect(resultado.mensaje).toContain('eliminado correctamente');
  });

  function contenidoExistente(): Contenido {
    return new Contenido(
      idContenido,
      'Actividad inicial',
      TipoContenido.ACTIVIDAD,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-01T00:00:00.000Z'),
    );
  }
});
