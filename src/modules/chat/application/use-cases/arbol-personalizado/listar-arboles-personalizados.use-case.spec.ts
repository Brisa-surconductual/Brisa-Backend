import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import {
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ListarArbolesPersonalizadosUseCase } from './listar-arboles-personalizados.use-case';

describe('ListarArbolesPersonalizadosUseCase (RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ListarArbolesPersonalizadosUseCase(repository);

  it('presenta siempre las cuatro combinaciones con su publicado e historial', async () => {
    repository.listarFlujosPersonalizados.mockResolvedValue([
      flujoPersonalizado(EstadoFlujoConversacional.PUBLICADO, 2),
      flujoPersonalizado(EstadoFlujoConversacional.ARCHIVADO, 1, ids.otroFlujo),
    ]);

    const { combinaciones } = await useCase.execute();

    expect(combinaciones).toHaveLength(4);
    const tolerancia = combinaciones.find(
      (item) =>
        item.tipo_dependencia === TipoDependenciaClinica.TOLERANCIA &&
        item.tipo_craving === TipoCravingClinico.NEGATIVO,
    );
    expect(tolerancia?.publicado?.id_flujo).toBe(ids.flujo);
    expect(tolerancia?.versiones.map((v) => v.version)).toEqual([2, 1]);
    expect(combinaciones.filter((c) => c.versiones.length === 0)).toHaveLength(
      3,
    );
  });
});
