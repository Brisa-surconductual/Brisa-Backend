import { AuditoriaArbolConversacional } from '../../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import { FlujoPersonalizadoNoEncontradoException } from '../../../domain/exceptions';
import {
  fecha,
  flujoGrupal,
  flujoPersonalizado,
  ids,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ConsultarAuditoriaArbolUseCase } from './consultar-auditoria-arbol.use-case';

describe('ConsultarAuditoriaArbolUseCase (RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new ConsultarAuditoriaArbolUseCase(repository);

  beforeEach(() => jest.resetAllMocks());

  it('lista las operaciones del árbol con el identificador como texto', async () => {
    repository.obtenerFlujo.mockResolvedValue(flujoPersonalizado());
    repository.listarAuditoriaArbol.mockResolvedValue([
      new AuditoriaArbolConversacional(
        9n,
        ids.flujo,
        ids.actor,
        'PUBLICAR',
        null,
        fecha,
      ),
    ]);

    const respuesta = await useCase.execute(ids.flujo);

    expect(respuesta).toEqual([
      {
        id_auditoria: '9',
        id_flujo: ids.flujo,
        id_actor: ids.actor,
        accion: 'PUBLICAR',
        id_objeto: null,
        fecha_operacion: fecha,
      },
    ]);
  });

  it('no revela la auditoría de un árbol grupal ni de uno inexistente', async () => {
    repository.obtenerFlujo.mockResolvedValueOnce(flujoGrupal());
    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoPersonalizadoNoEncontradoException,
    );

    repository.obtenerFlujo.mockResolvedValueOnce(null);
    await expect(useCase.execute(ids.flujo)).rejects.toBeInstanceOf(
      FlujoPersonalizadoNoEncontradoException,
    );
    expect(repository.listarAuditoriaArbol).not.toHaveBeenCalled();
  });
});
