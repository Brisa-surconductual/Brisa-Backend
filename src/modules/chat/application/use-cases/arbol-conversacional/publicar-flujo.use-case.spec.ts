import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoArchivadoException,
  GrafoInvalidoException,
} from '../../../domain/exceptions';
import {
  arbol,
  flujoGrupal,
  flujoPersonalizado,
  ids,
  nodo,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { PublicarFlujoUseCase } from './publicar-flujo.use-case';

describe('PublicarFlujoUseCase (RF-25 / RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new PublicarFlujoUseCase(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarPublicadoGrupal.mockResolvedValue(null);
    repository.buscarPublicadoPersonalizado.mockResolvedValue(null);
  });

  it('publica un flujo grupal válido', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    const respuesta = await useCase.execute(ids.flujo, ids.actor);

    const [guardado, actor] = repository.guardarFlujo.mock.calls[0];
    expect(guardado.estado).toBe(EstadoFlujoConversacional.PUBLICADO);
    expect(actor).toBe(ids.actor);
    expect(respuesta).toMatchObject({
      id_flujo: ids.flujo,
      estado: EstadoFlujoConversacional.PUBLICADO,
    });
    expect(respuesta.fecha_publicacion).toBeInstanceOf(Date);
  });

  it('no publica un segundo flujo grupal', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());
    repository.buscarPublicadoGrupal.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoGrupalPublicadoExistenteException,
    );
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('archiva el publicado anterior del perfil y publica el nuevo en una sola operación', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol(flujoPersonalizado()));
    repository.buscarPublicadoPersonalizado.mockResolvedValue(
      flujoPersonalizado(EstadoFlujoConversacional.PUBLICADO, 1, ids.otroFlujo),
    );

    await useCase.execute(ids.flujo, ids.actor);

    const [guardados] = repository.guardarFlujos.mock.calls[0];
    expect(guardados.map((flujo) => [flujo.idFlujo, flujo.estado])).toEqual([
      [ids.otroFlujo, EstadoFlujoConversacional.ARCHIVADO],
      [ids.flujo, EstadoFlujoConversacional.PUBLICADO],
    ]);
  });

  it('no publica directamente un personalizado archivado (RF-25C)', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbol(flujoPersonalizado(EstadoFlujoConversacional.ARCHIVADO)),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoPersonalizadoArchivadoException,
    );
  });

  it('solo publica borradores', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbol(flujoGrupal(EstadoFlujoConversacional.PUBLICADO)),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      EstadoFlujoInvalidoException,
    );
  });

  it('informa el detalle del grafo inválido y no modifica nada', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );

    const error = await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GrafoInvalidoException);
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
    expect(repository.guardarFlujos).not.toHaveBeenCalled();
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
