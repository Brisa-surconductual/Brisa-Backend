import {
  ArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TransicionConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  PersistenciaArbolConversacionalException,
  ReglaValidacionInvalidaException,
  SolicitudActualizacionVaciaException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import {
  ActualizarNodoConversacionalUseCase,
  CrearFlujoGrupalUseCase,
  CrearTransicionConversacionalUseCase,
  PublicarArbolConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
} from './gestionar-arbol-conversacional.use-cases';

describe('Casos de uso del árbol conversacional (RF-25)', () => {
  const idFlujo = '00000000-0000-4000-8000-000000000001';
  const idNodoA = '00000000-0000-4000-8000-000000000002';
  const idNodoB = '00000000-0000-4000-8000-000000000003';
  const idTipo = '00000000-0000-4000-8000-000000000004';
  const idAdministrador = '00000000-0000-4000-8000-000000000005';
  const fecha = new Date('2026-09-19T12:00:00.000Z');
  const flujo = new FlujoConversacional(
    idFlujo,
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    EstadoFlujoConversacional.BORRADOR,
    1,
    idAdministrador,
    fecha,
    null,
  );
  const nodoA = new NodoConversacional(
    idNodoA,
    idFlujo,
    idTipo,
    'MENSAJE',
    { texto: 'Inicio' },
    true,
    1,
    null,
    idAdministrador,
    fecha,
    fecha,
  );
  const nodoB = new NodoConversacional(
    idNodoB,
    idFlujo,
    idTipo,
    'PREGUNTA',
    { texto: 'Pregunta' },
    false,
    2,
    null,
    idAdministrador,
    fecha,
    fecha,
  );
  const regla = new ReglaValidacion(
    '00000000-0000-4000-8000-000000000006',
    TipoDatoValidacion.TEXTO,
    true,
    null,
    null,
    null,
    [],
    'Respuesta requerida',
  );
  const transicion = new TransicionConversacional(
    '00000000-0000-4000-8000-000000000007',
    idFlujo,
    idNodoA,
    idNodoB,
    OperadorCondicion.IGUALDAD,
    true,
    1,
    regla,
    fecha,
  );
  const repository: jest.Mocked<ArbolConversacionalRepository> = {
    crearFlujoGrupal: jest.fn(),
    obtenerArbol: jest.fn(),
    listarTiposNodo: jest.fn(),
    crearNodo: jest.fn(),
    actualizarNodo: jest.fn(),
    crearTransicion: jest.fn(),
    actualizarTransicion: jest.fn(),
    publicar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.crearFlujoGrupal.mockResolvedValue(flujo);
    repository.actualizarNodo.mockResolvedValue(nodoB);
    repository.crearTransicion.mockResolvedValue(transicion);
    repository.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujo, [nodoA, nodoB], [transicion]),
    );
    repository.publicar.mockResolvedValue(
      new FlujoConversacional(
        idFlujo,
        flujo.nombre,
        flujo.modalidad,
        EstadoFlujoConversacional.PUBLICADO,
        flujo.version,
        flujo.creadoPor,
        flujo.fechaCreacion,
        fecha,
      ),
    );
  });

  it('crea el flujo grupal con el administrador autenticado', async () => {
    const useCase = new CrearFlujoGrupalUseCase(repository);

    await useCase.execute(
      { nombre: '  Árbol grupal  ', version: 1 },
      idAdministrador,
    );

    expect(repository.crearFlujoGrupal.mock.calls[0][0]).toEqual({
      nombre: 'Árbol grupal',
      version: 1,
      creadoPor: idAdministrador,
    });
  });

  it('edita un nodo válido dentro del flujo indicado', async () => {
    const useCase = new ActualizarNodoConversacionalUseCase(repository);

    await useCase.execute(idFlujo, idNodoB, {
      contenido: { texto: 'Pregunta actualizada' },
      orden: 3,
    });

    expect(repository.actualizarNodo.mock.calls[0][0]).toEqual({
      idFlujo,
      idNodo: idNodoB,
      contenido: { texto: 'Pregunta actualizada' },
      orden: 3,
    });
  });

  it('rechaza una edición de nodo sin cambios', () => {
    const useCase = new ActualizarNodoConversacionalUseCase(repository);

    expect(() => useCase.execute(idFlujo, idNodoB, {})).toThrow(
      SolicitudActualizacionVaciaException,
    );
    expect(repository.actualizarNodo.mock.calls).toHaveLength(0);
  });

  it('crea una transición junto con su regla válida', async () => {
    const useCase = new CrearTransicionConversacionalUseCase(repository);

    await useCase.execute(idFlujo, {
      id_nodo_origen: idNodoA,
      id_nodo_destino: idNodoB,
      operador_condicion: OperadorCondicion.IGUALDAD,
      valor_condicion: true,
      orden_evaluacion: 1,
      regla_validacion: {
        tipo_dato: TipoDatoValidacion.TEXTO,
        obligatorio: true,
        valores_permitidos: [],
        mensaje_error: 'Respuesta requerida',
      },
    });

    const command = repository.crearTransicion.mock.calls[0][0];
    expect(command.idFlujo).toBe(idFlujo);
    expect(command.idNodoOrigen).toBe(idNodoA);
    expect(command.idNodoDestino).toBe(idNodoB);
    expect(command.reglaValidacion.tipoDato).toBe(TipoDatoValidacion.TEXTO);
  });

  it('rechaza una regla inválida antes de persistir la transición', () => {
    const useCase = new CrearTransicionConversacionalUseCase(repository);

    expect(() =>
      useCase.execute(idFlujo, {
        id_nodo_origen: idNodoA,
        id_nodo_destino: idNodoB,
        operador_condicion: OperadorCondicion.RANGO,
        valor_condicion: 10,
        orden_evaluacion: 1,
        regla_validacion: {
          tipo_dato: TipoDatoValidacion.NUMERICO,
          obligatorio: true,
          valor_min: 10,
          valor_max: 1,
          valores_permitidos: [],
          mensaje_error: 'Fuera de rango',
        },
      }),
    ).toThrow(ReglaValidacionInvalidaException);
    expect(repository.crearTransicion.mock.calls).toHaveLength(0);
  });

  it('valida la estructura completa antes de considerarla válida', async () => {
    const useCase = new ValidarArbolConversacionalUseCase(repository);

    await expect(useCase.execute(idFlujo)).resolves.toEqual({
      valido: true,
      total_nodos: 2,
      total_transiciones: 1,
    });
  });

  it('publica mediante la operación transaccional del repositorio', async () => {
    const useCase = new PublicarArbolConversacionalUseCase(repository);

    const resultado = await useCase.execute(idFlujo);

    expect(repository.publicar.mock.calls).toEqual([[idFlujo]]);
    expect(resultado.estado).toBe(EstadoFlujoConversacional.PUBLICADO);
  });

  it('oculta el detalle de un error inesperado de persistencia', async () => {
    repository.crearFlujoGrupal.mockRejectedValue(
      new Error('password authentication failed'),
    );
    const useCase = new CrearFlujoGrupalUseCase(repository);

    await expect(
      useCase.execute({ nombre: 'Árbol grupal', version: 1 }, idAdministrador),
    ).rejects.toBeInstanceOf(PersistenciaArbolConversacionalException);
  });
});
