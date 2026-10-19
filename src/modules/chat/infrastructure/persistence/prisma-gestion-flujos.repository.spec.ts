import { Prisma } from '@prisma/client';
import {
  flujoRow,
  ids,
  nodoRow,
  transicionRow,
} from '../../../../../test/chat/fixtures/arbol-hu03.fixture';
import {
  EstadoFlujoConversacional as Estado,
  ModalidadConversacional as Modalidad,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  GrafoInvalidoException,
  PublicadoPorPerfilExistenteException,
  VersionPersonalizadaDuplicadaException,
} from '../../domain/exeption/arbol-conversacional.exceptions';
import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';

describe('Persistencia de gestión general HU-05 / RF-25C', () => {
  const personalizado = {
    ...flujoRow,
    modalidad: Modalidad.PERSONALIZADA,
    tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
    tipo_craving: TipoCravingClinico.NEGATIVO,
  };
  const tx = {
    flujo_conversacion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    nodos: { findMany: jest.fn(), create: jest.fn() },
    reglas_nodos: { findMany: jest.fn(), create: jest.fn() },
    reglas_validaciones: { create: jest.fn() },
    auditoria_arboles: { create: jest.fn() },
  };
  const prisma = { ...tx, $transaction: jest.fn() };
  const repo = new PrismaArbolConversacionalRepository(prisma as never);
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (op: (cliente: typeof tx) => Promise<unknown>) => op(tx),
    );
    tx.flujo_conversacion.findUnique.mockResolvedValue(personalizado);
    tx.flujo_conversacion.findFirst.mockResolvedValue(null);
    tx.flujo_conversacion.findMany.mockResolvedValue([flujoRow, personalizado]);
    tx.flujo_conversacion.count.mockResolvedValue(25);
    tx.flujo_conversacion.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...personalizado, ...data, id_flujo: ids.otroFlujo }),
    );
    tx.flujo_conversacion.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...personalizado, ...data }),
    );
    tx.nodos.findMany.mockResolvedValue([
      nodoRow(ids.origen),
      nodoRow(ids.destino),
    ]);
    tx.reglas_nodos.findMany.mockResolvedValue([transicionRow]);
    tx.nodos.create
      .mockResolvedValueOnce({ id_nodo: 'nuevo-origen' })
      .mockResolvedValueOnce({ id_nodo: 'nuevo-destino' });
  });

  it('lista grupales y personalizados con total, offset y desempate estable', async () => {
    const resultado = await repo.listarFlujos({ page: 2, pageSize: 20 });
    expect(resultado.total).toBe(25);
    expect(resultado.items.map((flujo) => flujo.modalidad)).toEqual([
      Modalidad.GRUPAL,
      Modalidad.PERSONALIZADA,
    ]);
    expect(tx.flujo_conversacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        orderBy: [{ fecha_creacion: 'desc' }, { id_flujo: 'asc' }],
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('usa el mismo filtro combinado para el conteo y la página', async () => {
    const consulta = {
      modalidad: Modalidad.PERSONALIZADA,
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: TipoCravingClinico.NEGATIVO,
      estado: Estado.ARCHIVADO,
      page: 1,
      pageSize: 100,
    };
    await repo.listarFlujos(consulta);
    const where = {
      modalidad: consulta.modalidad,
      tipo_dependencia: consulta.tipoDependencia,
      tipo_craving: consulta.tipoCraving,
      estado: consulta.estado,
    };
    expect(tx.flujo_conversacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 0, take: 100 }),
    );
    expect(tx.flujo_conversacion.count).toHaveBeenCalledWith({ where });
  });

  it.each([Modalidad.GRUPAL, Modalidad.PERSONALIZADA])(
    'clona %s conservando reglas, condiciones y orden con UUID nuevos',
    async (modalidad) => {
      const origen = modalidad === Modalidad.GRUPAL ? flujoRow : personalizado;
      tx.flujo_conversacion.findUnique.mockResolvedValue({
        ...origen,
        estado: Estado.PUBLICADO,
        version: 3,
      });
      const resultado = await repo.clonarVersion(ids.flujo, ids.actor);
      expect(resultado).toMatchObject({
        idFlujoOrigen: ids.flujo,
        nodosCopiados: 2,
        transicionesCopiadas: 1,
        flujo: {
          idFlujo: ids.otroFlujo,
          version: 4,
          estado: Estado.BORRADOR,
          modalidad,
        },
      });
      expect(tx.flujo_conversacion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          modalidad,
          tipo_dependencia: origen.tipo_dependencia,
          tipo_craving: origen.tipo_craving,
          creado_por: ids.actor,
          estado: Estado.BORRADOR,
          version: 4,
        }) as Prisma.flujo_conversacionUncheckedCreateInput,
      });
      expect(tx.reglas_nodos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_flujo: ids.otroFlujo,
          id_nodo_origen: 'nuevo-origen',
          id_nodo_destino: 'nuevo-destino',
          id_regla_validacion: ids.validacion,
          valor_condicion: transicionRow.valor_condicion,
          orden_evaluacion: transicionRow.orden_evaluacion,
        }) as Prisma.reglas_nodosUncheckedCreateInput,
      });
      expect(tx.reglas_validaciones.create).not.toHaveBeenCalled();
      expect(tx.flujo_conversacion.findFirst).not.toHaveBeenCalled();
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
        data: {
          id_flujo: ids.otroFlujo,
          id_actor: ids.actor,
          accion: 'CLONAR_VERSION',
          id_objeto: ids.flujo,
        },
      });
    },
  );

  it('permite clonar un archivado', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      ...personalizado,
      estado: Estado.ARCHIVADO,
    });
    await expect(
      repo.clonarVersion(ids.flujo, ids.actor),
    ).resolves.toMatchObject({
      flujo: { version: 2, estado: Estado.BORRADOR },
    });
  });

  it('rechaza clonar borrador y no crea filas', async () => {
    await expect(
      repo.clonarVersion(ids.flujo, ids.actor),
    ).rejects.toBeInstanceOf(EstadoFlujoInvalidoException);
    expect(tx.flujo_conversacion.create).not.toHaveBeenCalled();
  });

  it('no renumera origen + 1 si la versión ya existe', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      ...personalizado,
      estado: Estado.PUBLICADO,
    });
    tx.flujo_conversacion.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: 'uq_flujo_version_personalizada' },
    });
    await expect(
      repo.clonarVersion(ids.flujo, ids.actor),
    ).rejects.toBeInstanceOf(VersionPersonalizadaDuplicadaException);
    expect(tx.nodos.create).not.toHaveBeenCalled();
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('propaga el fallo de una transición del clon sin auditar éxito', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      ...personalizado,
      estado: Estado.PUBLICADO,
    });
    tx.reglas_nodos.create.mockRejectedValue(new Error('fallo de copia'));
    await expect(repo.clonarVersion(ids.flujo, ids.actor)).rejects.toThrow(
      'fallo de copia',
    );
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('publica en borrador, fija fecha y audita sin archivar otro flujo', async () => {
    const resultado = await repo.publicarAdministrativo(ids.flujo, ids.actor);
    expect(resultado).toMatchObject({
      estado: Estado.PUBLICADO,
      fechaPublicacion: expect.any(Date) as Date,
    });
    expect(tx.flujo_conversacion.update).toHaveBeenCalledTimes(1);
    expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
      data: {
        id_flujo: ids.flujo,
        id_actor: ids.actor,
        accion: 'PUBLICAR',
        id_objeto: null,
      },
    });
  });

  it('incluye el UUID del publicado de la misma combinación', async () => {
    tx.flujo_conversacion.findFirst.mockResolvedValue({
      id_flujo: ids.otroFlujo,
    });
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toMatchObject({
      response: {
        codigo: 'YA_EXISTE_PUBLICADO',
        detalles: { id_flujo_publicado: ids.otroFlujo },
      },
    });
    expect(tx.flujo_conversacion.findFirst).toHaveBeenCalledWith({
      where: {
        modalidad: Modalidad.PERSONALIZADA,
        tipo_dependencia: personalizado.tipo_dependencia,
        tipo_craving: personalizado.tipo_craving,
        estado: Estado.PUBLICADO,
      },
      select: { id_flujo: true },
    });
    expect(tx.flujo_conversacion.update).not.toHaveBeenCalled();
    expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
  });

  it('no aplica el filtro clínico de personalizados a un grupal', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue(flujoRow);
    await repo.publicarAdministrativo(ids.flujo, ids.actor);
    expect(tx.flujo_conversacion.findFirst).not.toHaveBeenCalled();
  });

  it.each([Estado.PUBLICADO, Estado.ARCHIVADO])(
    'rechaza publicar desde %s',
    async (estado) => {
      tx.flujo_conversacion.findUnique.mockResolvedValue({
        ...personalizado,
        estado,
      });
      await expect(
        repo.publicarAdministrativo(ids.flujo, ids.actor),
      ).rejects.toBeInstanceOf(EstadoFlujoInvalidoException);
      expect(tx.flujo_conversacion.update).not.toHaveBeenCalled();
    },
  );

  it('devuelve detalles del nodo huérfano', async () => {
    tx.reglas_nodos.findMany.mockResolvedValue([]);
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toMatchObject({
      response: {
        codigo: 'GRAFO_INVALIDO',
        detalles: {
          nodos_huerfanos: [ids.destino],
          ciclos: [],
          sin_nodo_inicial: false,
        },
      },
    });
    expect(tx.flujo_conversacion.update).not.toHaveBeenCalled();
  });

  it('devuelve el recorrido del ciclo dirigido', async () => {
    tx.reglas_nodos.findMany.mockResolvedValue([
      transicionRow,
      {
        ...transicionRow,
        id_nodo_origen: ids.destino,
        id_nodo_destino: ids.origen,
      },
    ]);
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toMatchObject({
      response: {
        detalles: {
          ciclos: [[ids.origen, ids.destino, ids.origen]],
          sin_nodo_inicial: false,
        },
      },
    });
  });

  it('informa la ausencia de nodo inicial y rechaza publicar', async () => {
    tx.nodos.findMany.mockResolvedValue([
      { ...nodoRow(), es_nodo_inicial: false },
    ]);
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toBeInstanceOf(GrafoInvalidoException);
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toMatchObject({
      response: { detalles: { sin_nodo_inicial: true } },
    });
  });

  it.each([
    { target: 'uq_flujo_publicado_personalizada' },
    { target: ['modalidad', 'tipo_dependencia', 'tipo_craving'] },
  ])(
    'traduce el conflicto del índice y consulta al ganador fuera de la transacción: %j',
    async (meta) => {
      tx.flujo_conversacion.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id_flujo: ids.otroFlujo });
      tx.flujo_conversacion.update.mockRejectedValueOnce({
        code: 'P2002',
        meta,
      });
      await expect(
        repo.publicarAdministrativo(ids.flujo, ids.actor),
      ).rejects.toBeInstanceOf(PublicadoPorPerfilExistenteException);
      expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
    },
  );

  it('reintenta serialización y detecta el publicado por la otra solicitud', async () => {
    prisma.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    tx.flujo_conversacion.findFirst.mockResolvedValue({
      id_flujo: ids.otroFlujo,
    });
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toBeInstanceOf(PublicadoPorPerfilExistenteException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('no confunde una unicidad ajena con un publicado existente', async () => {
    const error = { code: 'P2002', meta: { target: 'auditoria_arboles_pkey' } };
    tx.auditoria_arboles.create.mockRejectedValue(error);
    await expect(
      repo.publicarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toEqual(error);
  });

  it.each([Estado.BORRADOR, Estado.PUBLICADO])(
    'archiva desde %s conservando las entidades relacionadas',
    async (estado) => {
      tx.flujo_conversacion.findUnique.mockResolvedValue({
        ...personalizado,
        estado,
      });
      const resultado = await repo.archivarAdministrativo(ids.flujo, ids.actor);
      expect(resultado).toMatchObject({
        estado: Estado.ARCHIVADO,
        fechaArchivado: expect.any(Date) as Date,
      });
      expect(tx.flujo_conversacion.update).toHaveBeenCalledWith({
        where: { id_flujo: ids.flujo },
        data: {
          estado: Estado.ARCHIVADO,
          fecha_archivado: expect.any(Date) as Date,
        },
      });
      expect(tx.nodos.create).not.toHaveBeenCalled();
      expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith({
        data: {
          id_flujo: ids.flujo,
          id_actor: ids.actor,
          accion: 'ARCHIVAR',
          id_objeto: null,
        },
      });
    },
  );

  it('rechaza archivar nuevamente', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue({
      ...personalizado,
      estado: Estado.ARCHIVADO,
    });
    await expect(
      repo.archivarAdministrativo(ids.flujo, ids.actor),
    ).rejects.toBeInstanceOf(EstadoFlujoInvalidoException);
    expect(tx.flujo_conversacion.update).not.toHaveBeenCalled();
  });

  it.each([
    'clonarVersion',
    'publicarAdministrativo',
    'archivarAdministrativo',
  ] as const)('%s devuelve 404 si el flujo no existe', async (metodo) => {
    tx.flujo_conversacion.findUnique.mockResolvedValue(null);
    await expect(repo[metodo](ids.flujo, ids.actor)).rejects.toBeInstanceOf(
      FlujoConversacionalNoEncontradoException,
    );
  });

  it.each(['publicarAdministrativo', 'archivarAdministrativo'] as const)(
    '%s propaga el fallo de auditoría',
    async (metodo) => {
      tx.auditoria_arboles.create.mockRejectedValue(
        new Error('auditoria fallida'),
      );
      await expect(repo[metodo](ids.flujo, ids.actor)).rejects.toThrow(
        'auditoria fallida',
      );
    },
  );
});
