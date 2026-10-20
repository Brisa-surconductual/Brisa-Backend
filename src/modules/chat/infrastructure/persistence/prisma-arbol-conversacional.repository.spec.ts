import {
  CicloConversacionalNoPermitidoException,
  NodoDestinoNoEncontradoException,
  NodoInicialDuplicadoException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
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
      findFirst: jest.fn(),
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
    tx.flujo_conversacion.findFirst.mockResolvedValue(null);
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      estado: EstadoFlujoConversacional.BORRADOR,
    });
  });

  it('busca exclusivamente el flujo grupal publicado y devuelve null si no existe', async () => {
    await expect(repository.buscarPublicadoGrupal()).resolves.toBeNull();
    expect(tx.flujo_conversacion.findFirst).toHaveBeenCalledWith({
      where: { modalidad: 'GRUPAL', estado: 'PUBLICADO' },
    });
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('devuelve el identificador y la versión del grupal publicado con sus datos de dominio', async () => {
    tx.flujo_conversacion.findFirst.mockResolvedValue({
      ...flujoRow,
      estado: 'PUBLICADO',
      version: 3,
      fecha_publicacion: fecha,
      fecha_archivado: null,
      tipo_dependencia: null,
      tipo_craving: null,
    });

    const publicado = await repository.buscarPublicadoGrupal();

    expect(publicado).toMatchObject({
      idFlujo,
      version: 3,
      modalidad: ModalidadConversacional.GRUPAL,
      estado: EstadoFlujoConversacional.PUBLICADO,
      fechaPublicacion: fecha,
      tipoDependencia: null,
      tipoCraving: null,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('permite cargar el grupal publicado y recuperar su nodo inicial sin cambiar sus referencias', async () => {
    const publicadoRow = { ...flujoRow, estado: 'PUBLICADO', version: 3 };
    tx.flujo_conversacion.findFirst.mockResolvedValue(publicadoRow);
    tx.flujo_conversacion.findUnique.mockResolvedValue(publicadoRow);
    tx.nodos.findMany.mockResolvedValue([
      nodoRow(idNodoA, true),
      nodoRow(idNodoB),
    ]);
    tx.reglas_nodos.findMany.mockResolvedValue([
      transicionRow(idNodoA, idNodoB),
    ]);

    const publicado = await repository.buscarPublicadoGrupal();
    expect(publicado).not.toBeNull();
    const arbol = await repository.obtenerArbol(publicado!.idFlujo);

    expect(arbol?.flujo.idFlujo).toBe(idFlujo);
    expect(arbol?.flujo.version).toBe(3);
    expect(arbol?.nodos.find((nodo) => nodo.esNodoInicial)?.idNodo).toBe(
      idNodoA,
    );
    expect(arbol?.transiciones[0].idNodoDestino).toBe(idNodoB);
    expect(tx.nodos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_flujo: idFlujo } }),
    );
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('propaga los errores de consulta sin confundirlos con la ausencia de un grupal publicado', async () => {
    const error = new Error('Consulta no disponible');
    tx.flujo_conversacion.findFirst.mockRejectedValueOnce(error);

    await expect(repository.buscarPublicadoGrupal()).rejects.toBe(error);
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
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: idFlujo,
        id_actor: idAdministrador,
        accion: 'CREAR_NODO',
        id_objeto: idNodoA,
      },
    });
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
      .mockResolvedValueOnce([
        { id_nodo: idNodoA, id_flujo: idFlujo },
        { id_nodo: idNodoB, id_flujo: idFlujo },
      ])
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
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: idFlujo,
        id_actor: idAdministrador,
        accion: 'CREAR_TRANSICION',
        id_objeto: transicionRow(idNodoA, idNodoB).id_regla,
      },
    });
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
      .mockResolvedValueOnce([
        { id_nodo: idNodoA, id_flujo: idFlujo },
        { id_nodo: idNodoB, id_flujo: idFlujo },
      ])
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
