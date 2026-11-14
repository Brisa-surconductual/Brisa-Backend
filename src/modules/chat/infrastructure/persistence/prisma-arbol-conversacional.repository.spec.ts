import { Prisma } from '@prisma/client';
import { ArbolConversacional } from '../../domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { EstadoFlujoConversacional } from '../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../domain/enums/tipo-dato-validacion-enum';
import {
  ContenidoCronogramaNoEncontradoException,
  FlujoGrupalPublicadoExistenteException,
  FlujoPersonalizadoPublicadoExistenteException,
  NodoInicialDuplicadoException,
  OrdenTransicionDuplicadoException,
  TipoNodoNoEncontradoException,
  VersionPersonalizadaDuplicadaException,
} from '../../domain/exceptions';
import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';

describe('PrismaArbolConversacionalRepository', () => {
  const ids = {
    flujo: '00000000-0000-4000-8000-000000000001',
    nodoA: '00000000-0000-4000-8000-000000000002',
    nodoB: '00000000-0000-4000-8000-000000000003',
    tipo: '00000000-0000-4000-8000-000000000004',
    actor: '00000000-0000-4000-8000-000000000005',
    regla: '00000000-0000-4000-8000-000000000006',
    transicion: '00000000-0000-4000-8000-000000000007',
    origen: '00000000-0000-4000-8000-000000000008',
  };
  const fecha = new Date('2026-09-19T12:00:00.000Z');

  const flujoGrupal = new FlujoConversacional(
    ids.flujo,
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    EstadoFlujoConversacional.BORRADOR,
    1,
    ids.actor,
    fecha,
    null,
  );
  const nodo = new NodoConversacional(
    ids.nodoA,
    ids.flujo,
    ids.tipo,
    'MENSAJE',
    { texto: 'Hola' },
    true,
    1,
    null,
    ids.actor,
    fecha,
    fecha,
  );
  const regla = new ReglaValidacion(
    ids.regla,
    TipoDatoValidacion.NUMERICO,
    true,
    1,
    5,
    null,
    [],
    'Fuera de rango',
  );
  const transicion = new TransicionConversacional(
    ids.transicion,
    ids.flujo,
    ids.nodoA,
    ids.nodoB,
    OperadorCondicion.IGUALDAD,
    'si',
    1,
    regla,
    fecha,
  );

  const flujoRow = {
    id_flujo: ids.flujo,
    nombre: 'Árbol grupal',
    modalidad: 'GRUPAL',
    estado: 'BORRADOR',
    version: 1,
    creado_por: ids.actor,
    fecha_creacion: fecha,
    fecha_publicacion: null,
    fecha_archivado: null,
    tipo_dependencia: null,
    tipo_craving: null,
  };
  const nodoRow = (id: string) => ({
    id_nodo: id,
    id_flujo: ids.flujo,
    id_tipo_nodo: ids.tipo,
    contenido: { texto: id },
    es_nodo_inicial: id === ids.nodoA,
    orden: 1,
    id_contenido_cronograma: null,
    creado_por: ids.actor,
    fecha_creacion: fecha,
    fecha_actualizacion: fecha,
    tipo_nodo: { nombre: 'MENSAJE' },
  });
  const reglaRow = {
    id_regla_validacion: ids.regla,
    tipo_dato: 'NUMERICO',
    obligatorio: true,
    valor_min: new Prisma.Decimal(1),
    valor_max: new Prisma.Decimal(5),
    formato_regex: null,
    valores_permitidos: [],
    mensaje_error: 'Fuera de rango',
  };
  const transicionRow = {
    id_regla: ids.transicion,
    id_flujo: ids.flujo,
    id_nodo_origen: ids.nodoA,
    id_nodo_destino: ids.nodoB,
    operador_condicion: 'IGUALDAD',
    valor_condicion: 'si',
    orden_evaluacion: 1,
    fecha_creacion: fecha,
    nodos_reglas_nodos_id_nodo_origen_id_flujoTonodos: {
      reglas_validaciones: reglaRow,
    },
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
    nodos: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reglas_nodos: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    reglas_validaciones: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    tipo_nodo: { findUnique: jest.fn(), findMany: jest.fn() },
    tipo_entrada: { findMany: jest.fn() },
    contenidos_cronograma: { findUnique: jest.fn(), findMany: jest.fn() },
    auditoria_arboles: { create: jest.fn(), findMany: jest.fn() },
  };
  const prisma = { ...tx, $transaction: jest.fn() };
  const repo = new PrismaArbolConversacionalRepository(prisma as never);

  const errorPrisma = (code: string, message = '', meta?: unknown) =>
    Object.assign(new Error(message), { code, meta });
  const auditoria = (
    accion: string,
    idFlujo: string | null = ids.flujo,
    idObjeto: string | null = null,
  ) => ({
    data: {
      id_flujo: idFlujo,
      id_actor: ids.actor,
      accion,
      id_objeto: idObjeto,
    },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (op: (cliente: typeof tx) => Promise<unknown>) => op(tx),
    );
    tx.flujo_conversacion.findUnique.mockResolvedValue(flujoRow);
    tx.flujo_conversacion.findMany.mockResolvedValue([flujoRow]);
    tx.flujo_conversacion.count.mockResolvedValue(1);
    tx.nodos.findMany.mockResolvedValue([nodoRow(ids.nodoA)]);
    tx.reglas_nodos.findMany.mockResolvedValue([transicionRow]);
    tx.auditoria_arboles.create.mockResolvedValue({});
  });

  describe('consultas', () => {
    it('filtra nodos y transiciones exclusivamente por el flujo solicitado', async () => {
      const arbol = await repo.obtenerArbol(ids.flujo);

      expect(tx.nodos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_flujo: ids.flujo } }),
      );
      expect(tx.reglas_nodos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_flujo: ids.flujo } }),
      );
      expect(arbol).toBeInstanceOf(ArbolConversacional);
      expect(arbol?.transiciones[0].reglaValidacion.valorMax).toBe(5);
    });

    it('retorna null si el flujo no existe', async () => {
      tx.flujo_conversacion.findUnique.mockResolvedValue(null);

      await expect(repo.obtenerArbol(ids.flujo)).resolves.toBeNull();
      await expect(repo.obtenerFlujo(ids.flujo)).resolves.toBeNull();
    });

    it('lista con el mismo filtro para la página y el conteo', async () => {
      const resultado = await repo.listarFlujos(
        {
          modalidad: ModalidadConversacional.PERSONALIZADA,
          estado: EstadoFlujoConversacional.PUBLICADO,
        },
        3,
        10,
      );

      const where = tx.flujo_conversacion.findMany.mock.calls[0][0].where;
      expect(tx.flujo_conversacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(tx.flujo_conversacion.count).toHaveBeenCalledWith({ where });
      expect(resultado.total).toBe(1);
      expect(resultado.items[0]).toBeInstanceOf(FlujoConversacional);
    });

    it('calcula la última versión del perfil, 0 si no hay ninguna', async () => {
      tx.flujo_conversacion.findFirst.mockResolvedValueOnce({ version: 4 });
      tx.flujo_conversacion.findFirst.mockResolvedValueOnce(null);

      await expect(
        repo.obtenerUltimaVersionPersonalizada(
          TipoDependenciaClinica.TOLERANCIA,
          TipoCravingClinico.NEGATIVO,
        ),
      ).resolves.toBe(4);
      await expect(
        repo.obtenerUltimaVersionPersonalizada(
          TipoDependenciaClinica.TOLERANCIA,
          TipoCravingClinico.NEGATIVO,
        ),
      ).resolves.toBe(0);
    });

    it('consulta la auditoría por flujo y conserva bigint', async () => {
      tx.auditoria_arboles.findMany.mockResolvedValue([
        {
          id_auditoria: 7,
          id_actor: ids.actor,
          accion: 'PUBLICAR',
          id_objeto: null,
          fecha_operacion: fecha,
        },
      ]);

      const registros = await repo.listarAuditoriaArbol(ids.flujo);

      expect(tx.auditoria_arboles.findMany).toHaveBeenCalledWith({
        where: { id_flujo: ids.flujo },
        orderBy: { id_auditoria: 'asc' },
      });
      expect(registros[0].idAuditoria).toBe(7n);
    });
  });

  describe('guardarFlujo / guardarFlujos', () => {
    it('crea el flujo nuevo y su auditoría en la misma transacción serializable', async () => {
      tx.flujo_conversacion.findUnique.mockResolvedValue(null);

      await repo.guardarFlujo(flujoGrupal, ids.actor);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      expect(tx.flujo_conversacion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_flujo: ids.flujo,
          nombre: 'Árbol grupal',
          modalidad: 'GRUPAL',
          estado: 'BORRADOR',
          version: 1,
          creado_por: ids.actor,
        }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('CREAR_FLUJO'),
      );
    });

    it('persiste la publicación de un flujo existente y la audita', async () => {
      await repo.guardarFlujo(flujoGrupal.publicar(fecha), ids.actor);

      expect(tx.flujo_conversacion.create).not.toHaveBeenCalled();
      expect(tx.flujo_conversacion.update).toHaveBeenCalledWith({
        where: { id_flujo: ids.flujo },
        data: {
          nombre: 'Árbol grupal',
          estado: 'PUBLICADO',
          fecha_publicacion: fecha,
          fecha_archivado: null,
        },
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('PUBLICAR'),
      );
    });

    it('guarda varios flujos en una sola transacción, en el orden recibido', async () => {
      const publicado = flujoGrupal.publicar(fecha);
      const archivado = publicado.archivar(fecha);

      await repo.guardarFlujos(
        [archivado, flujoGrupal.publicar(fecha)],
        ids.actor,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(
        tx.auditoria_arboles.create.mock.calls.map(
          ([arg]) => arg.data.accion as string,
        ),
      ).toEqual(['ARCHIVAR', 'PUBLICAR']);
    });

    it.each([
      [
        'versión duplicada',
        'Unique constraint failed uq_flujo_version_personalizada',
        VersionPersonalizadaDuplicadaException,
      ],
      [
        'publicado grupal',
        'Unique constraint failed uq_flujo_publicado_grupal',
        FlujoGrupalPublicadoExistenteException,
      ],
      [
        'publicado personalizado',
        'Unique constraint failed uq_flujo_publicado_personalizada',
        FlujoPersonalizadoPublicadoExistenteException,
      ],
    ])(
      'traduce el conflicto de unicidad: %s',
      async (_caso, mensaje, excepcion) => {
        tx.flujo_conversacion.update.mockRejectedValue(
          errorPrisma('P2002', mensaje),
        );

        await expect(
          repo.guardarFlujo(flujoGrupal.publicar(fecha), ids.actor),
        ).rejects.toBeInstanceOf(excepcion);
      },
    );

    it('reintenta la transacción serializable cuando Prisma informa P2034', async () => {
      tx.flujo_conversacion.findUnique.mockResolvedValue(null);
      prisma.$transaction
        .mockRejectedValueOnce(errorPrisma('P2034'))
        .mockImplementation(
          async (op: (cliente: typeof tx) => Promise<unknown>) => op(tx),
        );

      await repo.guardarFlujo(flujoGrupal, ids.actor);

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('propaga un error desconocido sin traducirlo', async () => {
      const fallo = new Error('conexión perdida');
      tx.flujo_conversacion.findUnique.mockRejectedValue(fallo);

      await expect(repo.guardarFlujo(flujoGrupal, ids.actor)).rejects.toBe(
        fallo,
      );
    });
  });

  describe('guardarNodo', () => {
    it('crea el nodo nuevo con su identificador y audita CREAR_NODO', async () => {
      tx.nodos.findUnique.mockResolvedValue(null);

      await repo.guardarNodo(nodo, ids.actor);

      expect(tx.nodos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_nodo: ids.nodoA,
          id_flujo: ids.flujo,
          id_tipo_nodo: ids.tipo,
          es_nodo_inicial: true,
          orden: 1,
          id_contenido_cronograma: null,
        }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('CREAR_NODO', ids.flujo, ids.nodoA),
      );
    });

    it('actualiza el nodo existente, permite limpiar campos y audita EDITAR_NODO', async () => {
      tx.nodos.findUnique.mockResolvedValue({ id_nodo: ids.nodoA });
      const editado = nodo.actualizar({ orden: null });

      await repo.guardarNodo(editado, ids.actor);

      expect(tx.nodos.create).not.toHaveBeenCalled();
      expect(tx.nodos.update).toHaveBeenCalledWith({
        where: { id_nodo: ids.nodoA },
        data: expect.objectContaining({
          orden: null,
          fecha_actualizacion: editado.fechaActualizacion,
        }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('EDITAR_NODO', ids.flujo, ids.nodoA),
      );
    });

    it('traduce el nodo inicial duplicado y la FK de tipo inexistente', async () => {
      tx.nodos.findUnique.mockResolvedValue(null);
      tx.nodos.create.mockRejectedValueOnce(
        errorPrisma('P2002', 'uq_nodo_inicial_por_flujo'),
      );
      await expect(repo.guardarNodo(nodo, ids.actor)).rejects.toBeInstanceOf(
        NodoInicialDuplicadoException,
      );

      tx.nodos.create.mockRejectedValueOnce(
        errorPrisma('P2003', 'fk_nodo_tipo'),
      );
      await expect(repo.guardarNodo(nodo, ids.actor)).rejects.toBeInstanceOf(
        TipoNodoNoEncontradoException,
      );

      tx.nodos.create.mockRejectedValueOnce(
        errorPrisma('P2003', 'fk_nodo_contenido_cronograma'),
      );
      await expect(repo.guardarNodo(nodo, ids.actor)).rejects.toBeInstanceOf(
        ContenidoCronogramaNoEncontradoException,
      );
      expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
    });
  });

  describe('existeContenidoCronograma', () => {
    it('es true cuando la asociación existe', async () => {
      tx.contenidos_cronograma.findUnique.mockResolvedValue({
        id_contenido_cronograma: 'cc-1',
      });

      await expect(repo.existeContenidoCronograma('cc-1')).resolves.toBe(true);
    });

    it('es false cuando no existe', async () => {
      tx.contenidos_cronograma.findUnique.mockResolvedValue(null);

      await expect(repo.existeContenidoCronograma('cc-1')).resolves.toBe(false);
    });
  });

  describe('listarContenidosCronograma', () => {
    it('mapea el contenido y la unidad temporal asociada', async () => {
      tx.contenidos_cronograma.findMany.mockResolvedValue([
        {
          id_contenido_cronograma: 'cc-1',
          id_contenido: 'c-1',
          id_unidad_temporal: 'ut-1',
          contenidos: { nombre_contenido: 'Video 1' },
          unidades_temporales: { nombre_unidad: 'Semana 1', orden_unidad: 1 },
        },
      ]);

      const items = await repo.listarContenidosCronograma();

      expect(items).toEqual([
        expect.objectContaining({
          idContenidoCronograma: 'cc-1',
          idContenido: 'c-1',
          nombreContenido: 'Video 1',
          idUnidadTemporal: 'ut-1',
          nombreUnidad: 'Semana 1',
          ordenUnidad: 1,
        }),
      ]);
    });
  });

  describe('guardarTransicion', () => {
    it('guarda la regla junto con la transición nueva y audita CREAR_TRANSICION', async () => {
      tx.reglas_nodos.findUnique.mockResolvedValue(null);

      await repo.guardarTransicion(transicion, ids.actor);

      expect(tx.reglas_validaciones.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_regla_validacion: ids.regla },
        }),
      );
      expect(tx.nodos.update).toHaveBeenCalledWith({
        where: { id_nodo: ids.nodoA },
        data: { id_regla_validacion: ids.regla },
      });
      expect(tx.reglas_nodos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_regla: ids.transicion,
          id_nodo_origen: ids.nodoA,
          id_nodo_destino: ids.nodoB,
          orden_evaluacion: 1,
        }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('CREAR_TRANSICION', ids.flujo, ids.transicion),
      );
    });

    it('actualiza la transición existente y audita EDITAR_TRANSICION', async () => {
      tx.reglas_nodos.findUnique.mockResolvedValue({
        id_regla: ids.transicion,
      });

      await repo.guardarTransicion(
        transicion.actualizar({ ordenEvaluacion: 2 }),
        ids.actor,
      );

      expect(tx.reglas_nodos.create).not.toHaveBeenCalled();
      expect(tx.reglas_nodos.update).toHaveBeenCalledWith({
        where: { id_regla: ids.transicion },
        data: expect.objectContaining({ orden_evaluacion: 2 }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('EDITAR_TRANSICION', ids.flujo, ids.transicion),
      );
    });

    it('traduce el orden de evaluación duplicado sin auditar', async () => {
      tx.reglas_nodos.findUnique.mockResolvedValue(null);
      tx.reglas_nodos.create.mockRejectedValue(errorPrisma('P2002'));

      await expect(
        repo.guardarTransicion(transicion, ids.actor),
      ).rejects.toBeInstanceOf(OrdenTransicionDuplicadoException);
      expect(tx.auditoria_arboles.create).not.toHaveBeenCalled();
    });
  });

  describe('guardarArbolClonado', () => {
    it('persiste flujo, nodos, reglas y transiciones y audita el origen', async () => {
      const origen = new ArbolConversacional(
        flujoGrupal.publicar(fecha),
        [
          nodo,
          nodo.copiarEn(ids.flujo, ids.actor).actualizar({
            esNodoInicial: false,
          }),
        ],
        [],
      );
      const clon = origen.clonar(2, ids.actor);

      await repo.guardarArbolClonado(clon, ids.flujo, ids.actor);

      expect(tx.flujo_conversacion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_flujo: clon.flujo.idFlujo,
          estado: 'BORRADOR',
          version: 2,
        }),
      });
      expect(tx.nodos.create).toHaveBeenCalledTimes(2);
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('CLONAR_VERSION', clon.flujo.idFlujo, ids.flujo),
      );
    });
  });

  describe('guardarReglaValidacion', () => {
    it('persiste la regla y su evento propio, sin flujo, en la misma transacción', async () => {
      await repo.guardarReglaValidacion(regla, ids.actor);

      expect(tx.reglas_validaciones.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_regla_validacion: ids.regla,
          tipo_dato: 'NUMERICO',
          valor_min: 1,
          valor_max: 5,
          mensaje_error: 'Fuera de rango',
        }),
      });
      expect(tx.auditoria_arboles.create).toHaveBeenCalledWith(
        auditoria('CREAR_REGLA_VALIDACION', null, ids.regla),
      );
    });

    it('propaga un fallo de auditoría para que la creación se revierta', async () => {
      const fallo = new Error('auditoría no disponible');
      tx.auditoria_arboles.create.mockRejectedValue(fallo);

      await expect(repo.guardarReglaValidacion(regla, ids.actor)).rejects.toBe(
        fallo,
      );
    });
  });

  it('convierte los límites decimales de una regla sin alterar su valor', async () => {
    tx.reglas_validaciones.findUnique.mockResolvedValue({
      ...reglaRow,
      valor_min: new Prisma.Decimal('1.5'),
      valor_max: null,
    });

    const encontrada = await repo.buscarReglaValidacion(ids.regla);

    expect(encontrada?.valorMin).toBe(1.5);
    expect(encontrada?.valorMax).toBeNull();
  });
});
