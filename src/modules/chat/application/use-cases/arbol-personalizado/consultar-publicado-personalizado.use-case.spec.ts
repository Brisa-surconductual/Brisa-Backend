import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import { PerfilClinicoArbolInvalidoException } from '../../../domain/exceptions';
import {
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ConsultarPublicadoPersonalizadoUseCase } from './consultar-publicado-personalizado.use-case';

describe('ConsultarPublicadoPersonalizadoUseCase (RF-25C / RF-26B)', () => {
  const repository = repositorioSimulado();
  const useCase = new ConsultarPublicadoPersonalizadoUseCase(repository);
  const perfil = {
    tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
    tipo_craving: TipoCravingClinico.NEGATIVO,
  };

  beforeEach(() => jest.resetAllMocks());

  it('devuelve el árbol publicado de la combinación', async () => {
    repository.buscarPublicadoPersonalizado.mockResolvedValue(
      flujoPersonalizado(EstadoFlujoConversacional.PUBLICADO),
    );

    const respuesta = await useCase.execute(perfil);

    expect(repository.buscarPublicadoPersonalizado).toHaveBeenCalledWith(
      TipoDependenciaClinica.TOLERANCIA,
      TipoCravingClinico.NEGATIVO,
    );
    expect(respuesta?.id_flujo).toBe(ids.flujo);
  });

  it('devuelve null cuando no hay publicado', async () => {
    repository.buscarPublicadoPersonalizado.mockResolvedValue(null);

    await expect(useCase.execute(perfil)).resolves.toBeNull();
  });

  it('rechaza una combinación de perfil inválida', async () => {
    await expect(
      useCase.execute({
        ...perfil,
        tipo_craving: 'OTRO' as TipoCravingClinico,
      }),
    ).rejects.toBeInstanceOf(PerfilClinicoArbolInvalidoException);
    expect(repository.buscarPublicadoPersonalizado).not.toHaveBeenCalled();
  });
});
