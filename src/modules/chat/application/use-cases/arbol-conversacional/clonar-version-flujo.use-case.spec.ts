import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  VersionPersonalizadaNoClonableException,
} from '../../../domain/exceptions';
import {
  arbol,
  flujoGrupal,
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ClonarVersionFlujoUseCase } from './clonar-version-flujo.use-case';

describe('ClonarVersionFlujoUseCase (RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ClonarVersionFlujoUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('clona un grupal publicado como borrador con la versión siguiente', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbol(flujoGrupal(EstadoFlujoConversacional.PUBLICADO)),
    );

    const respuesta = await useCase.execute(ids.flujo, ids.actor);

    const [clon, origen, actor] = repository.guardarArbolClonado.mock.calls[0];
    expect(clon).toBeInstanceOf(ArbolConversacional);
    expect(clon.flujo.idFlujo).not.toBe(ids.flujo);
    expect(origen).toBe(ids.flujo);
    expect(actor).toBe(ids.actor);
    expect(respuesta).toMatchObject({
      id_flujo_origen: ids.flujo,
      nodos_copiados: 2,
      transiciones_copiadas: 1,
      flujo: {
        version: 2,
        estado: EstadoFlujoConversacional.BORRADOR,
      },
    });
  });

  it('copia cada regla de validación con identificador propio', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbol(flujoGrupal(EstadoFlujoConversacional.PUBLICADO)),
    );

    await useCase.execute(ids.flujo, ids.actor);

    const [clon] = repository.guardarArbolClonado.mock.calls[0];
    expect(clon.transiciones[0].reglaValidacion.idReglaValidacion).not.toBe(
      ids.regla,
    );
  });

  it('numera el personalizado a partir de la última versión de su perfil', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbol(flujoPersonalizado(EstadoFlujoConversacional.ARCHIVADO, 2)),
    );
    repository.obtenerUltimaVersionPersonalizada.mockResolvedValue(7);

    const respuesta = await useCase.execute(ids.flujo, ids.actor);

    expect(respuesta.flujo.version).toBe(8);
  });

  it('no clona un borrador', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());
    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      EstadoFlujoInvalidoException,
    );

    repository.obtenerArbol.mockResolvedValue(arbol(flujoPersonalizado()));
    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      VersionPersonalizadaNoClonableException,
    );
    expect(repository.guardarArbolClonado).not.toHaveBeenCalled();
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
