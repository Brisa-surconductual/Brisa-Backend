import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  DimensionPerfilClinico as Dimension,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import {
  CoberturaTransicionesIncompletaException,
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoArchivadoException,
  GrafoInvalidoException,
  NodoCapturaPerfilInvalidoException,
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

const idNodoDependencia = '00000000-0000-4000-8000-000000000019';
const idNodoCraving = '00000000-0000-4000-8000-000000000020';
const fecha = new Date('2026-10-01T12:00:00.000Z');

const DOMINIO: Record<Dimension, string[]> = {
  [Dimension.TIPO_DEPENDENCIA]: [
    TipoDependenciaClinica.ABSTINENCIA_FISICA,
    TipoDependenciaClinica.TOLERANCIA,
  ],
  [Dimension.TIPO_CRAVING]: [
    TipoCravingClinico.POSITIVO,
    TipoCravingClinico.NEGATIVO,
  ],
};

function nodoCaptura(
  idNodo: string,
  dimension: Dimension,
  opciones: string[] = DOMINIO[dimension],
): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    ids.flujo,
    ids.tipo,
    'PREGUNTA',
    {
      texto: 'Pregunta clínica',
      capturaPerfil: { dimension },
      entrada: {
        tipo: 'SELECCION_UNICA',
        opciones: opciones.map((valor) => ({ valor, etiqueta: valor })),
      },
    },
    false,
    2,
    null,
    ids.actor,
    fecha,
    fecha,
  );
}

/** Una transición por valor esperado, todas hacia `destino`. */
function salidas(
  origen: string,
  destino: string,
  valores: string[],
): TransicionConversacional[] {
  return valores.map(
    (valor, i) =>
      new TransicionConversacional(
        `${origen}-${destino}-${valor}`,
        ids.flujo,
        origen,
        destino,
        i + 1,
        new ReglaValidacion(
          `regla-${origen}-${valor}`,
          TipoDatoValidacion.TEXTO,
          true,
          null,
          null,
          null,
          [],
          'Selecciona una opción.',
          OperadorCondicion.IGUALDAD,
          { valor },
        ),
        fecha,
      ),
  );
}

/** Árbol grupal válido también en RF-25: A (inicial) → captura x2 → B. */
function arbolGrupalConPerfil(
  dependencia = nodoCaptura(idNodoDependencia, Dimension.TIPO_DEPENDENCIA),
  craving = nodoCaptura(idNodoCraving, Dimension.TIPO_CRAVING),
): ArbolConversacional {
  const valores = (n: NodoConversacional) =>
    (n.contenido.entrada as { opciones: { valor: string }[] }).opciones.map(
      (o) => o.valor,
    );
  return new ArbolConversacional(
    flujoGrupal(),
    [nodo(ids.nodoA), dependencia, craving, nodo(ids.nodoB)],
    [
      ...salidas(ids.nodoA, dependencia.idNodo, ['si', 'no']),
      ...salidas(dependencia.idNodo, craving.idNodo, valores(dependencia)),
      ...salidas(craving.idNodo, ids.nodoB, valores(craving)),
    ],
  );
}

describe('PublicarFlujoUseCase (RF-25 / RF-25C)', () => {
  const repository = repositorioSimulado();
  const useCase = new PublicarFlujoUseCase(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.buscarPublicadoGrupal.mockResolvedValue(null);
    repository.buscarPublicadoPersonalizado.mockResolvedValue(null);
  });

  it('publica un flujo grupal válido', async () => {
    repository.obtenerArbol.mockResolvedValue(arbolGrupalConPerfil());

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
    repository.obtenerArbol.mockResolvedValue(arbolGrupalConPerfil());
    repository.buscarPublicadoGrupal.mockResolvedValue(
      flujoGrupal(EstadoFlujoConversacional.PUBLICADO),
    );

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoGrupalPublicadoExistenteException,
    );
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('no publica un árbol grupal sin ningún nodo de captura de perfil clínico', async () => {
    repository.obtenerArbol.mockResolvedValue(arbol());

    const error = await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NodoCapturaPerfilInvalidoException);
    expect(
      (error as NodoCapturaPerfilInvalidoException).detalles,
    ).toMatchObject({
      dimensiones_ausentes: [
        Dimension.TIPO_DEPENDENCIA,
        Dimension.TIPO_CRAVING,
      ],
    });
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('no publica un árbol grupal con una dimensión duplicada', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbolGrupalConPerfil(
        nodoCaptura(idNodoDependencia, Dimension.TIPO_DEPENDENCIA),
        nodoCaptura(idNodoCraving, Dimension.TIPO_DEPENDENCIA),
      ),
    );

    const error = await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NodoCapturaPerfilInvalidoException);
    expect(
      (error as NodoCapturaPerfilInvalidoException).detalles,
    ).toMatchObject({
      dimensiones_ausentes: [Dimension.TIPO_CRAVING],
      dimensiones_duplicadas: [Dimension.TIPO_DEPENDENCIA],
    });
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('no publica un árbol grupal cuyo nodo de captura no ofrece las opciones del dominio clínico', async () => {
    repository.obtenerArbol.mockResolvedValue(
      arbolGrupalConPerfil(
        nodoCaptura(idNodoDependencia, Dimension.TIPO_DEPENDENCIA, [
          'OTRO_VALOR',
        ]),
      ),
    );

    const error = await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NodoCapturaPerfilInvalidoException);
    expect(
      (error as NodoCapturaPerfilInvalidoException).detalles,
    ).toMatchObject({
      dimensiones_ausentes: [],
      dimensiones_duplicadas: [],
      dimensiones_valores_invalidos: [Dimension.TIPO_DEPENDENCIA],
    });
    expect(repository.guardarFlujo).not.toHaveBeenCalled();
  });

  it('no publica si una opción de selección única no tiene transición', async () => {
    const completo = arbolGrupalConPerfil();
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        completo.flujo,
        completo.nodos,
        completo.transiciones.filter(
          (t) => t.idTransicion !== `${ids.nodoA}-${idNodoDependencia}-no`,
        ),
      ),
    );

    const error = await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CoberturaTransicionesIncompletaException);
    expect(
      (error as CoberturaTransicionesIncompletaException).detalles,
    ).toMatchObject({
      nodos_sin_cobertura: [
        expect.objectContaining({
          id_nodo: ids.nodoA,
          valores_faltantes: ['no'],
        }),
      ],
    });
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

  it('identifica el nodo huérfano por orden y texto, no solo por id', async () => {
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoGrupal(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );

    const error = (await useCase
      .execute(ids.flujo, ids.actor)
      .catch((e: unknown) => e)) as GrafoInvalidoException;

    // nodoA es inicial por defecto en la fábrica de prueba; sin transiciones,
    // nodoB queda huérfano (inalcanzable) y nodoA no lo está.
    expect(error.detalles).toMatchObject({ sin_nodo_inicial: false });
    const detalles = error.detalles as {
      nodos_huerfanos: {
        id_nodo: string;
        orden: number | null;
        texto: string;
      }[];
    };
    expect(detalles.nodos_huerfanos).toEqual([
      { id_nodo: ids.nodoB, orden: 1, texto: 'Hola' },
    ]);
  });

  it('responde que el flujo no existe', async () => {
    repository.obtenerArbol.mockResolvedValue(null);

    await expect(useCase.execute(ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });
});
