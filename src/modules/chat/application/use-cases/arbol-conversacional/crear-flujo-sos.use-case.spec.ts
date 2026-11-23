import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ModalidadSosRutaPropiaException } from '../../../domain/exceptions';
import { CrearFlujoSinPerfilService } from '../../services/crear-flujo-sin-perfil.service';
import { ids, repositorioSimulado } from '../../support/testing/arbol-fixtures';
import { CrearFlujoConversacionalUseCase } from './crear-flujo-conversacional.use-case';
import { CrearFlujoSosUseCase } from './crear-flujo-sos.use-case';

describe('CrearFlujoSosUseCase (RF-43)', () => {
  const repository = repositorioSimulado();
  const sinPerfil = new CrearFlujoSinPerfilService(repository);
  const useCase = new CrearFlujoSosUseCase(repository, sinPerfil);

  beforeEach(() => jest.resetAllMocks());

  it('crea un borrador SOS con la siguiente versión y sin perfil clínico', async () => {
    repository.obtenerUltimaVersionSinPerfil.mockResolvedValue(2);

    const respuesta = await useCase.execute(
      { nombre: '  Protocolo SOS  ' },
      ids.actor,
    );

    expect(repository.obtenerUltimaVersionSinPerfil).toHaveBeenCalledWith(
      ModalidadConversacional.SOS,
    );
    const [flujo, actor] = repository.guardarFlujo.mock.calls[0];
    expect(actor).toBe(ids.actor);
    expect(flujo).toMatchObject({
      nombre: 'Protocolo SOS',
      modalidad: ModalidadConversacional.SOS,
      estado: EstadoFlujoConversacional.BORRADOR,
      version: 3,
      tipoDependencia: null,
      tipoCraving: null,
      creadoPor: ids.actor,
    });
    expect(flujo.esPublicadoUnico).toBe(true);
    expect(respuesta).toMatchObject({
      modalidad: ModalidadConversacional.SOS,
      version: 3,
    });
  });

  it('la primera versión SOS es la 1', async () => {
    repository.obtenerUltimaVersionSinPerfil.mockResolvedValue(0);

    await useCase.execute({ nombre: 'Protocolo SOS' }, ids.actor);

    expect(repository.guardarFlujo.mock.calls[0][0].version).toBe(1);
  });

  it('la creación genérica rechaza la modalidad SOS', async () => {
    const generico = new CrearFlujoConversacionalUseCase(repository, sinPerfil);

    await expect(
      generico.execute(
        { nombre: 'SOS', modalidad: ModalidadConversacional.SOS },
        ids.actor,
      ),
    ).rejects.toBeInstanceOf(ModalidadSosRutaPropiaException);
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });
});
