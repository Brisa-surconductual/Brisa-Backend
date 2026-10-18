import { Prisma } from '@prisma/client';
import {
  fecha,
  flujoRow,
  ids,
  nodoRow,
  reglaRow,
  transicionRow,
} from '../../../../../test/chat/fixtures/arbol-hu03.fixture';
import {
  EstadoFlujoConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoConversacionalNoEditableException,
  NodoDestinoNoEncontradoException,
  NodoFueraDeFlujoException,
  ReglaValidacionInvalidaException,
  ReglaValidacionNoEncontradaException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';
import {
  CrearReglaValidacionCommand,
  DatosReglaValidacionCommand,
} from '../../domain/repositories/arbol-conversacional.repository';

describe('Persistencia administrativa HU-03', () => {
  const tx = {
    flujo_conversacion: { findUnique: jest.fn(), create: jest.fn() },
    nodos: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reglas_nodos: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    reglas_validaciones: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tipo_nodo: { findUnique: jest.fn(), findMany: jest.fn() },
    tipo_entrada: { findMany: jest.fn() },
    auditoria_arboles: { create: jest.fn(), findMany: jest.fn() },
  };
  const prisma = { ...tx, $transaction: jest.fn() };
  const repo = new PrismaArbolConversacionalRepository(prisma as never);
  const nodoCommand = {
    idFlujo: ids.flujo,
    idTipoNodo: ids.tipo,
    contenido: { texto: 'Hola' },
    esNodoInicial: false,
    orden: null,
    idContenidoCronograma: null,
    creadoPor: ids.actor,
  };
  const transicionCommand = {
    idFlujo: ids.flujo,
    idNodoOrigen: ids.origen,
    idNodoDestino: ids.destino,
    idReglaValidacion: ids.validacion,
    operadorCondicion: OperadorCondicion.IGUALDAD,
    valorCondicion: 'si',
    ordenEvaluacion: 1,
    creadoPor: ids.actor,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (op: (cliente: typeof tx) => Promise<unknown>) => op(tx),
    );
    tx.flujo_conversacion.findUnique.mockResolvedValue(flujoRow);
    tx.flujo_conversacion.create.mockResolvedValue(flujoRow);
    tx.nodos.findFirst.mockResolvedValue(nodoRow());
    tx.nodos.findUnique.mockResolvedValue(nodoRow());
    tx.nodos.findMany.mockResolvedValue([
      nodoRow(ids.origen),
      nodoRow(ids.destino),
    ]);
    tx.nodos.create.mockResolvedValue(nodoRow());
    tx.nodos.update.mockResolvedValue(nodoRow());
    tx.tipo_nodo.findUnique.mockResolvedValue({ id_tipo_nodo: ids.tipo });
    tx.reglas_nodos.findFirst.mockResolvedValue(transicionRow);
    tx.reglas_nodos.findUnique.mockResolvedValue(transicionRow);
    tx.reglas_nodos.findMany.mockResolvedValue([]);
    tx.reglas_nodos.create.mockResolvedValue(transicionRow);
    tx.reglas_nodos.update.mockResolvedValue(transicionRow);
    tx.reglas_nodos.count.mockResolvedValue(1);
    tx.reglas_validaciones.findUnique.mockResolvedValue(reglaRow);
    tx.reglas_validaciones.findMany.mockResolvedValue([reglaRow]);
    tx.reglas_validaciones.create.mockResolvedValue(reglaRow);
    tx.auditoria_arboles.create.mockResolvedValue({});
  });

  it('crea flujo y auditoría con el delegado del esquema chat en la misma transacción serializable', async () => {
    await repo.crearFlujoGrupal({
      nombre: 'Inicio',
      version: 1,
      creadoPor: ids.actor,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.flujo_conversacion.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Inicio',
        modalidad: 'GRUPAL',
        estado: 'BORRADOR',
        version: 1,
        creado_por: ids.actor,
      },
    });
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: ids.flujo,
        id_actor: ids.actor,
        accion: 'CREAR_FLUJO',
        id_objeto: null,
      },
    });
  });

  it('filtra nodos y transiciones exclusivamente por el flujo solicitado', async () => {
    await repo.obtenerArbol(ids.flujo);
    expect(tx.nodos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_flujo: ids.flujo } }),
    );
    expect(tx.reglas_nodos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_flujo: ids.flujo } }),
    );
  });

  it('consulta la auditoría por flujo con el delegado Prisma y conserva bigint', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      modalidad: 'PERSONALIZADA',
    });
    tx.auditoria_arboles.findMany.mockResolvedValue([
      {
        id_auditoria: 9007199254740993n,
        id_flujo: ids.flujo,
        id_actor: ids.actor,
        accion: 'CREAR_FLUJO',
        id_objeto: null,
        fecha_operacion: fecha,
      },
    ]);
    const resultado = await repo.listarAuditoriaArbol(ids.flujo);
    expect(resultado[0].idAuditoria).toBe(9007199254740993n);
    expect(tx.auditoria_arboles.findMany).toHaveBeenCalledWith({
      where: { id_flujo: ids.flujo },
      orderBy: { id_auditoria: 'asc' },
    });
  });

  it('audita la creación del nodo con actor y objeto', async () => {
    await repo.crearNodo(nodoCommand);
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: ids.flujo,
        id_actor: ids.actor,
        accion: 'CREAR_NODO',
        id_objeto: ids.origen,
      },
    });
  });

  it('permite limpiar relaciones y orden, conservando los campos omitidos y actualizando fecha', async () => {
    await repo.actualizarNodo({
      idFlujo: ids.flujo,
      idNodo: ids.origen,
      actualizadoPor: ids.actor,
      orden: null,
      idContenidoCronograma: null,
    });
    expect(tx.nodos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          id_tipo_nodo: undefined,
          contenido: undefined,
          es_nodo_inicial: undefined,
          orden: null,
          id_contenido_cronograma: null,
          fecha_actualizacion: expect.any(Date) as unknown,
        },
      }),
    );
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: 'EDITAR_NODO',
          id_actor: ids.actor,
        }) as unknown,
      }),
    );
  });

  it('traduce la FK de contenido inexistente sin auditar una escritura fallida', async () => {
    tx.nodos.create.mockRejectedValue({
      code: 'P2003',
      meta: { constraint: 'fk_nodo_contenido_cronograma' },
    });
    await expect(repo.crearNodo(nodoCommand)).rejects.toBeInstanceOf(
      ContenidoCronogramaNoEncontradoException,
    );
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('reutiliza una regla existente sin crear otra y audita la transición', async () => {
    await repo.crearTransicion(transicionCommand);
    expect(tx.reglas_validaciones.findUnique).toHaveBeenCalledWith({
      where: { id_regla_validacion: ids.validacion },
    });
    expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
    expect(tx.reglas_nodos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_regla_validacion: ids.validacion,
        }) as unknown,
      }),
    );
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: 'CREAR_TRANSICION',
          id_objeto: ids.transicion,
        }) as unknown,
      }),
    );
  });

  it('diferencia un nodo de otro flujo con 422 y no escribe', async () => {
    tx.nodos.findMany.mockResolvedValueOnce([
      nodoRow(),
      { ...nodoRow(ids.destino), id_flujo: ids.otroFlujo },
    ]);
    await expect(
      repo.crearTransicion(transicionCommand),
    ).rejects.toBeInstanceOf(NodoFueraDeFlujoException);
    expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
  });

  it('conserva 404 cuando el nodo destino no existe', async () => {
    tx.nodos.findMany.mockResolvedValueOnce([nodoRow()]);
    await expect(
      repo.crearTransicion(transicionCommand),
    ).rejects.toBeInstanceOf(NodoDestinoNoEncontradoException);
  });

  it('rechaza una regla inexistente antes de crear la transición', async () => {
    tx.reglas_validaciones.findUnique.mockResolvedValue(null);
    await expect(
      repo.crearTransicion(transicionCommand),
    ).rejects.toBeInstanceOf(ReglaValidacionNoEncontradaException);
    expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
  });

  it('sustituye la referencia de regla sin modificar su definición global', async () => {
    await repo.actualizarTransicion({
      idFlujo: ids.flujo,
      idTransicion: ids.transicion,
      actualizadoPor: ids.actor,
      idReglaValidacion: ids.otraValidacion,
    });
    expect(tx.reglas_nodos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_regla_validacion: ids.otraValidacion,
          valor_condicion: undefined,
          orden_evaluacion: undefined,
        }) as unknown,
      }),
    );
    expect(tx.reglas_validaciones.update).not.toHaveBeenCalled();
    expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: 'EDITAR_TRANSICION',
        }) as unknown,
      }),
    );
  });

  it('la edición embebida anterior copia una regla compartida sin alterar otras transiciones', async () => {
    tx.reglas_nodos.count.mockResolvedValue(2);
    tx.reglas_validaciones.create.mockResolvedValue({
      ...reglaRow,
      id_regla_validacion: ids.otraValidacion,
    });
    await repo.actualizarTransicion({
      idFlujo: ids.flujo,
      idTransicion: ids.transicion,
      actualizadoPor: ids.actor,
      reglaValidacion: { mensajeError: 'Nuevo mensaje' },
    });
    expect(tx.reglas_validaciones.update).not.toHaveBeenCalled();
    expect(tx.reglas_validaciones.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mensaje_error: 'Nuevo mensaje',
      }) as unknown,
    });
    expect(tx.reglas_nodos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_regla: ids.transicion },
        data: expect.objectContaining({
          id_regla_validacion: ids.otraValidacion,
        }) as unknown,
      }),
    );
  });

  const escrituras = [
    [
      'crear flujo',
      () =>
        repo.crearFlujoGrupal({
          nombre: 'Inicio',
          version: 1,
          creadoPor: ids.actor,
        }),
    ],
    ['crear nodo', () => repo.crearNodo(nodoCommand)],
    [
      'editar nodo',
      () =>
        repo.actualizarNodo({
          idFlujo: ids.flujo,
          idNodo: ids.origen,
          actualizadoPor: ids.actor,
          orden: 2,
        }),
    ],
    ['crear transición', () => repo.crearTransicion(transicionCommand)],
    [
      'editar transición',
      () =>
        repo.actualizarTransicion({
          idFlujo: ids.flujo,
          idTransicion: ids.transicion,
          actualizadoPor: ids.actor,
          ordenEvaluacion: 2,
        }),
    ],
  ] as const;

  it.each(escrituras)(
    'propaga un fallo de auditoría para revertir la transacción al %s',
    async (_nombre, operacion) => {
      const error = new Error('fallo de auditoría simulado');
      tx.auditoria_arboles.create.mockRejectedValue(error);
      await expect(operacion()).rejects.toBe(error);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    },
  );

  describe.each([
    EstadoFlujoConversacional.PUBLICADO,
    EstadoFlujoConversacional.ARCHIVADO,
  ])('flujo %s', (estado) => {
    it.each(escrituras.slice(1))(
      'impide %s antes de cualquier escritura',
      async (_nombre, operacion) => {
        tx.flujo_conversacion.findUnique.mockResolvedValue({
          ...flujoRow,
          estado,
        });
        await expect(operacion()).rejects.toBeInstanceOf(
          FlujoConversacionalNoEditableException,
        );
        expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
        expect(tx.nodos.create).not.toHaveBeenCalled();
        expect(tx.reglas_nodos.update).not.toHaveBeenCalled();
      },
    );
  });

  it('reintenta la transacción serializable cuando Prisma informa P2034', async () => {
    prisma.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    await repo.crearFlujoGrupal({
      nombre: 'Inicio',
      version: 1,
      creadoPor: ids.actor,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('mantiene la identidad del flujo al resolver nodos y transiciones por UUID', async () => {
    await expect(repo.buscarNodo(ids.origen)).resolves.toMatchObject({
      idFlujo: ids.flujo,
    });
    await expect(repo.buscarTransicion(ids.transicion)).resolves.toMatchObject({
      idFlujo: ids.flujo,
    });
  });

  const datosRegla: CrearReglaValidacionCommand = {
    tipoDato: reglaRow.tipo_dato,
    obligatorio: true,
    valorMin: null,
    valorMax: null,
    formatoRegex: null,
    valoresPermitidos: [],
    mensajeError: 'Respuesta requerida',
    creadoPor: ids.actor,
  };

  it('03-G persiste regla y evento propio con actor y objeto, sin flujo, en la misma transacción', async () => {
    await expect(repo.crearReglaValidacion(datosRegla)).resolves.toMatchObject({
      idReglaValidacion: ids.validacion,
    });
    expect(tx.reglas_validaciones.create).toHaveBeenCalledWith({
      data: {
        tipo_dato: 'TEXTO',
        obligatorio: true,
        valor_min: null,
        valor_max: null,
        formato_regex: null,
        valores_permitidos: [],
        mensaje_error: 'Respuesta requerida',
      },
    });
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: null,
        id_actor: ids.actor,
        accion: 'CREAR_REGLA_VALIDACION',
        id_objeto: ids.validacion,
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it.each<Partial<DatosReglaValidacionCommand>>([
    { tipoDato: TipoDatoValidacion.NUMERICO, valorMin: 10, valorMax: 1 },
    { valorMin: 1 },
    { formatoRegex: '[' },
    { tipoDato: TipoDatoValidacion.NUMERICO, formatoRegex: '^x$' },
    { tipoDato: TipoDatoValidacion.SELECCION },
    { valoresPermitidos: ['a'] },
    { mensajeError: '   ' },
  ])(
    '03-G rechaza una definición incoherente antes de escribir: %j',
    async (cambios) => {
      await expect(
        repo.crearReglaValidacion({ ...datosRegla, ...cambios }),
      ).rejects.toBeInstanceOf(ReglaValidacionInvalidaException);
      expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
    },
  );

  it('03-G convierte límites decimales sin alterar el valor de la regla', async () => {
    tx.reglas_validaciones.create.mockResolvedValue({
      ...reglaRow,
      tipo_dato: 'NUMERICO',
      valor_min: new Prisma.Decimal('0.5'),
      valor_max: new Prisma.Decimal('2.75'),
    });
    await expect(
      repo.crearReglaValidacion({
        ...datosRegla,
        tipoDato: TipoDatoValidacion.NUMERICO,
        valorMin: 0.5,
        valorMax: 2.75,
      }),
    ).resolves.toMatchObject({ valorMin: 0.5, valorMax: 2.75 });
  });

  it('03-G propaga un fallo de base de datos sin inventar una regla creada', async () => {
    const error = new Error('base no disponible');
    tx.reglas_validaciones.create.mockRejectedValue(error);
    await expect(repo.crearReglaValidacion(datosRegla)).rejects.toBe(error);
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('03-G propaga un fallo de auditoría para que la creación de la regla se revierta', async () => {
    const error = new Error('fallo de auditoría global simulado');
    tx.auditoria_arboles.create.mockRejectedValue(error);
    await expect(repo.crearReglaValidacion(datosRegla)).rejects.toBe(error);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
