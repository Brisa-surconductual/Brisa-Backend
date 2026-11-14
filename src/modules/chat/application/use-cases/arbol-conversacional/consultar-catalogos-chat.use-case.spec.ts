import { ContenidoCronogramaConversacional } from '../../../domain/entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../../../domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../../domain/entities/catalogos/tipo-nodo.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  ids,
  reglaTexto,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ConsultarCatalogosChatUseCase } from './consultar-catalogos-chat.use-case';

describe('ConsultarCatalogosChatUseCase (RF-25)', () => {
  const repository = repositorioSimulado();
  const useCase = new ConsultarCatalogosChatUseCase(repository);

  it('entrega tipos de nodo y entrada, reglas reutilizables y enums', async () => {
    repository.listarTiposNodo.mockResolvedValue([
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    ]);
    repository.listarTiposEntrada.mockResolvedValue([
      new TipoEntradaConversacional('entrada-1', 'TEXTO_LIBRE'),
    ]);
    repository.listarReglasValidacion.mockResolvedValue([reglaTexto]);
    repository.listarContenidosCronograma.mockResolvedValue([
      new ContenidoCronogramaConversacional(
        'cc-1',
        'c-1',
        'Video 1',
        'ut-1',
        'Semana 1',
        1,
      ),
    ]);

    const respuesta = await useCase.execute();

    expect(respuesta.tipos_nodo).toEqual([
      { id_tipo_nodo: ids.tipo, nombre: 'MENSAJE' },
    ]);
    expect(respuesta.tipos_entrada).toEqual([
      { id_tipo_entrada: 'entrada-1', nombre: 'TEXTO_LIBRE' },
    ]);
    expect(respuesta.reglas_validacion[0].id_regla_validacion).toBe(ids.regla);
    expect(respuesta.contenidos_cronograma).toEqual([
      {
        id_contenido_cronograma: 'cc-1',
        id_contenido: 'c-1',
        nombre_contenido: 'Video 1',
        id_unidad_temporal: 'ut-1',
        nombre_unidad: 'Semana 1',
        orden_unidad: 1,
      },
    ]);
    expect(respuesta.enums.modalidad).toEqual(
      Object.values(ModalidadConversacional),
    );
  });
});
