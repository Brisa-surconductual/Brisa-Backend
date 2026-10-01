import {
  CicloConversacionalNoPermitidoException,
  NodoDestinoNoEncontradoException,
  NodoInicialDuplicadoException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import {
  EstadoFlujoConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../domain/enums/arbol-conversacional.enums';
import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';

describe('PrismaArbolConversacionalRepository (RF-25)', () => {
  const idFlujo = '00000000-0000-4000-8000-000000000001';
  const idNodoA = '00000000-0000-4000-8000-000000000002';
  const idNodoB = '00000000-0000-4000-8000-000000000003';
  const idTipo = '00000000-0000-4000-8000-000000000004';
  const idAdministrador = '00000000-0000-4000-8000-000000000005';
  const idValidacion = '00000000-0000-4000-8000-000000000006';
  const fecha = new Date('2026-09-19T12:00:00.000Z');
  const flujoRow = {
    id_flujo: idFlujo,
    nombre: 'Árbol grupal',
    modalidad: 'GRUPAL',
    estado: 'BORRADOR',
    version: 1,
    creado_por: idAdministrador,
    fecha_creacion: fecha,
    fecha_publicacion: null,
  };
  const nodoRow = (id: string, inicial = false) => ({
    id_nodo: id,
    id_flujo: idFlujo,
    id_tipo_nodo: idTipo,
    contenido: { texto: id },
    es_nodo_inicial: inicial,
    orden: inicial ? 1 : 2,
    id_contenido_cronograma: null,
    creado_por: idAdministrador,
    fecha_creacion: fecha,
    fecha_actualizacion: fecha,
    tipo_nodo: { nombre: inicial ? 'MENSAJE' : 'PREGUNTA' },
  });
  const validacionRow = {
    id_regla_validacion: idValidacion,
    tipo_dato: 'TEXTO',
    obligatorio: true,
    valor_min: null,
    valor_max: null,
    formato_regex: null,
    valores_permitidos: [],
    mensaje_error: 'Respuesta requerida',
  };
  const transicionRow = (origen: string, destino: string) => ({
    id_regla: '00000000-0000-4000-8000-000000000007',
    id_flujo: idFlujo,
    id_nodo_origen: origen,
    id_nodo_destino: destino,
    id_regla_validacion: idValidacion,
    operador_condicion: 'IGUALDAD',
    valor_condicion: true,
    orden_evaluacion: 1,
    fecha_creacion: fecha,
    reglas_validaciones: validacionRow,
  });

  const tx = {
    flujo_conversacion: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    nodos: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reglas_nodos: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reglas_validaciones: {
      create: jest.fn(),
      update: jest.fn(),
    },
    tipo_nodo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditoria_arboles: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    ),
  };
  const repository = new PrismaArbolConversacionalRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      estado: EstadoFlujoConversacional.BORRADOR,
    });
  });

  it('crea un nodo válido dentro de una transacción', async () => {
    tx.tipo_nodo.findUnique.mockResolvedValue({ id_tipo_nodo: idTipo });
    tx.nodos.create.mockResolvedValue(nodoRow(idNodoA, true));

    const resultado = await repository.crearNodo({
      idFlujo,
      idTipoNodo: idTipo,
      contenido: { texto: 'Inicio' },
      esNodoInicial: true,
      orden: 1,
      idContenidoCronograma: null,
      creadoPor: idAdministrador,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(resultado.idNodo).toBe(idNodoA);
    const llamadasCrearNodo = tx.nodos.create.mock.calls as unknown as Array<
      [{ data: { id_flujo: string } }]
    >;
    expect(llamadasCrearNodo[0][0]).toMatchObject({
      data: { id_flujo: idFlujo },
    });
  });

  it('traduce la colisión del nodo inicial a HTTP 409', async () => {
    tx.tipo_nodo.findUnique.mockResolvedValue({ id_tipo_nodo: idTipo });
    tx.nodos.create.mockRejectedValue({
      code: 'P2002',
      meta: { constraint: 'uq_nodo_inicial_por_flujo' },
    });

    await expect(
      repository.crearNodo({
        idFlujo,
        idTipoNodo: idTipo,
        contenido: { texto: 'Inicio duplicado' },
        esNodoInicial: true,
        orden: 1,
        idContenidoCronograma: null,
        creadoPor: idAdministrador,
      }),
    ).rejects.toBeInstanceOf(NodoInicialDuplicadoException);
  });

  it('crea atómicamente una transición y su regla de validación', async () => {
    tx.flujo_conversacion.findUnique
      .mockResolvedValueOnce({ estado: EstadoFlujoConversacional.BORRADOR })
      .mockResolvedValueOnce(flujoRow);
    tx.nodos.findMany
      .mockResolvedValueOnce([{ id_nodo: idNodoA }, { id_nodo: idNodoB }])
      .mockResolvedValueOnce([nodoRow(idNodoA, true), nodoRow(idNodoB)]);
    tx.reglas_nodos.findMany.mockResolvedValue([]);
    tx.reglas_validaciones.create.mockResolvedValue(validacionRow);
    tx.reglas_nodos.create.mockResolvedValue(transicionRow(idNodoA, idNodoB));

    const resultado = await repository.crearTransicion({
      idFlujo,
      creadoPor: idAdministrador,
      idNodoOrigen: idNodoA,
      idNodoDestino: idNodoB,
      operadorCondicion: OperadorCondicion.IGUALDAD,
      valorCondicion: true,
      ordenEvaluacion: 1,
      reglaValidacion: {
        tipoDato: TipoDatoValidacion.TEXTO,
        obligatorio: true,
        valorMin: null,
        valorMax: null,
        formatoRegex: null,
        valoresPermitidos: [],
        mensajeError: 'Respuesta requerida',
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.reglas_validaciones.create).toHaveBeenCalledTimes(1);
    expect(tx.reglas_nodos.create).toHaveBeenCalledTimes(1);
    expect(resultado.idNodoDestino).toBe(idNodoB);
  });

  it('no persiste parcialmente si el nodo destino no pertenece al flujo', async () => {
    tx.nodos.findMany.mockResolvedValue([{ id_nodo: idNodoA }]);

    await expect(
      repository.crearTransicion({
        idFlujo,
        creadoPor: idAdministrador,
        idNodoOrigen: idNodoA,
        idNodoDestino: idNodoB,
        operadorCondicion: OperadorCondicion.IGUALDAD,
        valorCondicion: true,
        ordenEvaluacion: 1,
        reglaValidacion: {
          tipoDato: TipoDatoValidacion.TEXTO,
          obligatorio: true,
          valorMin: null,
          valorMax: null,
          formatoRegex: null,
          valoresPermitidos: [],
          mensajeError: 'Respuesta requerida',
        },
      }),
    ).rejects.toBeInstanceOf(NodoDestinoNoEncontradoException);
    expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
    expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
  });

  it('rechaza el ciclo antes de escribir la regla y la transición', async () => {
    tx.flujo_conversacion.findUnique
      .mockResolvedValueOnce({ estado: EstadoFlujoConversacional.BORRADOR })
      .mockResolvedValueOnce(flujoRow);
    tx.nodos.findMany
      .mockResolvedValueOnce([{ id_nodo: idNodoA }, { id_nodo: idNodoB }])
      .mockResolvedValueOnce([nodoRow(idNodoA, true), nodoRow(idNodoB)]);
    tx.reglas_nodos.findMany.mockResolvedValue([
      transicionRow(idNodoB, idNodoA),
    ]);

    await expect(
      repository.crearTransicion({
        idFlujo,
        creadoPor: idAdministrador,
        idNodoOrigen: idNodoA,
        idNodoDestino: idNodoB,
        operadorCondicion: OperadorCondicion.IGUALDAD,
        valorCondicion: true,
        ordenEvaluacion: 1,
        reglaValidacion: {
          tipoDato: TipoDatoValidacion.TEXTO,
          obligatorio: true,
          valorMin: null,
          valorMax: null,
          formatoRegex: null,
          valoresPermitidos: [],
          mensajeError: 'Respuesta requerida',
        },
      }),
    ).rejects.toBeInstanceOf(CicloConversacionalNoPermitidoException);
    expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
    expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
  });
});
