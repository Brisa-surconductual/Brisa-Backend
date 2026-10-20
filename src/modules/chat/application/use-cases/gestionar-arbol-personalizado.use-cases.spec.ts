import {
  ArbolConversacional,
  FlujoConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  EliminacionArbolPersonalizadoProhibidaException,
  FlujoPersonalizadoNoEncontradoException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  ConsultarPublicadoPersonalizadoUseCase,
  CrearArbolPersonalizadoUseCase,
  ListarArbolesPersonalizadosUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
} from './gestionar-arbol-personalizado.use-cases';

describe('Casos de uso de árboles personalizados (RF-25C)', () => {
  const idFlujo = '00000000-0000-4000-8000-000000000001';
  const idActor = '00000000-0000-4000-8000-000000000002';
  const fecha = new Date('2026-09-30T12:00:00.000Z');
  const flujo = new FlujoConversacional(
    idFlujo,
    'Árbol personalizado',
    ModalidadConversacional.PERSONALIZADA,
    EstadoFlujoConversacional.PUBLICADO,
    2,
    idActor,
    fecha,
    fecha,
    TipoDependenciaClinica.ABSTINENCIA_FISICA,
    TipoCravingClinico.POSITIVO,
  );
  const repository = {
    crearFlujoPersonalizado: jest.fn(),
    listarFlujosPersonalizados: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    obtenerArbol: jest.fn(),
  } as unknown as jest.Mocked<ArbolConversacionalRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.crearFlujoPersonalizado.mockResolvedValue(flujo);
    repository.listarFlujosPersonalizados.mockResolvedValue([flujo]);
    repository.buscarPublicadoPersonalizado.mockResolvedValue(flujo);
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujo, [], []),
    );
  });

  it('crea el borrador con actor autenticado y combinación recibida', async () => {
    const useCase = new CrearArbolPersonalizadoUseCase(repository);
    await useCase.execute(
      {
        nombre: '  Árbol personalizado  ',
        tipo_dependencia: TipoDependenciaClinica.ABSTINENCIA_FISICA,
        tipo_craving: TipoCravingClinico.POSITIVO,
      },
      idActor,
    );

    expect(repository.crearFlujoPersonalizado.mock.calls[0][0]).toEqual({
      nombre: 'Árbol personalizado',
      tipoDependencia: TipoDependenciaClinica.ABSTINENCIA_FISICA,
      tipoCraving: TipoCravingClinico.POSITIVO,
      creadoPor: idActor,
    });
  });

  it('lista siempre las cuatro combinaciones con su historial independiente', async () => {
    const useCase = new ListarArbolesPersonalizadosUseCase(repository);
    const respuesta = await useCase.execute();

    expect(respuesta.combinaciones).toHaveLength(4);
    const grupo = respuesta.combinaciones.find(
      (item) =>
        item.tipo_dependencia === TipoDependenciaClinica.ABSTINENCIA_FISICA &&
        item.tipo_craving === TipoCravingClinico.POSITIVO,
    );
    expect(grupo?.publicado?.id_flujo).toBe(idFlujo);
    expect(grupo?.versiones.map((version) => version.version)).toEqual([2]);
    expect(
      respuesta.combinaciones.filter((item) => item.versiones.length === 0),
    ).toHaveLength(3);
  });

  it('retorna null a RF-26B cuando no hay publicado', async () => {
    repository.buscarPublicadoPersonalizado.mockResolvedValue(null);
    const useCase = new ConsultarPublicadoPersonalizadoUseCase(repository);

    await expect(
      useCase.execute({
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
      }),
    ).resolves.toBeNull();
  });

  it('prohíbe la eliminación física de un árbol personalizado existente', async () => {
    const useCase = new RechazarEliminacionArbolPersonalizadoUseCase(
      repository,
    );

    await expect(useCase.execute(idFlujo)).rejects.toBeInstanceOf(
      EliminacionArbolPersonalizadoProhibidaException,
    );
  });

  it('no revela un árbol grupal a través del endpoint personalizado', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        new FlujoConversacional(
          idFlujo,
          'Grupal',
          ModalidadConversacional.GRUPAL,
          EstadoFlujoConversacional.PUBLICADO,
          1,
          idActor,
          fecha,
          fecha,
        ),
        [],
        [],
      ),
    );
    const useCase = new RechazarEliminacionArbolPersonalizadoUseCase(
      repository,
    );

    await expect(useCase.execute(idFlujo)).rejects.toBeInstanceOf(
      FlujoPersonalizadoNoEncontradoException,
    );
  });
});
