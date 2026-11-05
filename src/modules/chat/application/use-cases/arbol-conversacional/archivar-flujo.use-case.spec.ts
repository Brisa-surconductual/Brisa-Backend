import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  FlujoPersonalizadoYaArchivadoException,
} from '../../../domain/exceptions';
import {
  flujoGrupal,
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ArchivarFlujoUseCase } from './archivar-flujo.use-case';

describe('ArchivarFlujoUseCase (RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ArchivarFlujoUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('archiva un flujo publicado y registra la fecha', async () => {
    repository.obtenerFlujo.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
    );

    const respuesta = await useCase.execute(ids.flujo, ids.actor);

    expect(repository.guardarFlujo.mock.calls[0][0].estado).toBe(
      EstadoFlujoConversacional.ARCHIVADO,
    );
    expect(respuesta).toMatchObject({
      id_flujo: ids.flujo,
      estado: EstadoFlujoConversacional.ARCHIVADO,
    });
    expect(respuesta.fecha_archivado).toBeInstanceOf(Date);
  });

  it('informa que un personalizado ya estaba archivado', async () => {
    repository.obtenerFlujo.mockResolvedValue(
      flujoPersonalizado(EstadoFlujoConversacional.ARCHIVADO),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoPersonalizadoYaArchivadoException,
    );
  });

  it('rechaza archivar un grupal ya archivado', async () => {
    repository.obtenerFlujo.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO).archivar(),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      EstadoFlujoInvalidoException,
    );
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerFlujo.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
