import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';
import {
  EstadoFlujoConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  FlujoPersonalizadoArchivadoException,
  NodoInicialInexistenteException,
  PerfilClinicoArbolInvalidoException,
} from '../../domain/exeption/arbol-conversacional.exceptions';

describe('Persistencia de árboles personalizados (RF-25C)', () => {
  const idFlujo = '00000000-0000-4000-8000-000000000001';
  const idAnterior = '00000000-0000-4000-8000-000000000002';
  const idActor = '00000000-0000-4000-8000-000000000003';
  const fecha = new Date('2026-09-30T12:00:00.000Z');
  const perfil = {
    tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
    tipoCraving: TipoCravingClinico.NEGATIVO,
  };
  const fila = (
    id: string,
    estado = EstadoFlujoConversacional.BORRADOR,
    version = 2,
  ) => ({
    id_flujo: id,
    nombre: 'Intervención personalizada',
    modalidad: 'PERSONALIZADA',
    tipo_dependencia: perfil.tipoDependencia,
    tipo_craving: perfil.tipoCraving,
    estado,
    version,
    creado_por: idActor,
    fecha_creacion: fecha,
    fecha_publicacion:
      estado === EstadoFlujoConversacional.PUBLICADO ? fecha : null,
    fecha_archivado:
      estado === EstadoFlujoConversacional.ARCHIVADO ? fecha : null,
  });
  const nodo = (id: string, inicial = false) => ({
    id_nodo: id,
    id_flujo: idFlujo,
    id_tipo_nodo: '00000000-0000-4000-8000-000000000010',
    contenido: { texto: id },
    es_nodo_inicial: inicial,
    orden: inicial ? 1 : 2,
    id_contenido_cronograma: null,
    creado_por: idActor,
    fecha_creacion: fecha,
    fecha_actualizacion: fecha,
    tipo_nodo: { nombre: 'MENSAJE' },
  });
  const tx = {
    flujo_conversacion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    nodos: { findMany: jest.fn(), create: jest.fn() },
    reglas_nodos: { findMany: jest.fn(), create: jest.fn() },
    reglas_validaciones: { create: jest.fn() },
    tipo_nodo: { findUnique: jest.fn() },
    auditoria_arboles: { create: jest.fn(), findMany: jest.fn() },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    ),
  };
  const repository = new PrismaArbolConversacionalRepository(prisma as never);
  const argumento = (mock: jest.Mock, indice = 0): unknown =>
    (mock.mock.calls as unknown[][])[indice][0];

  beforeEach(() => {
    jest.clearAllMocks();
    tx.flujo_conversacion.findUnique.mockResolvedValue(fila(idFlujo));
    tx.nodos.findMany.mockResolvedValue([nodo(idFlujo, true)]);
    tx.reglas_nodos.findMany.mockResolvedValue([]);
    tx.flujo_conversacion.findFirst.mockResolvedValue(null);
    tx.auditoria_arboles.create.mockResolvedValue({});
  });

  it('asigna la versión siguiente solo dentro de la combinación y audita la creación', async () => {
    tx.flujo_conversacion.findFirst.mockResolvedValue({ version: 3 });
    tx.flujo_conversacion.create.mockResolvedValue(
      fila(idFlujo, EstadoFlujoConversacional.BORRADOR, 4),
    );

    const creado = await repository.crearFlujoPersonalizado({
      ...perfil,
      nombre: 'Intervención personalizada',
      creadoPor: idActor,
    });

    expect(creado.version).toBe(4);
    expect(argumento(tx.flujo_conversacion.findFirst)).toMatchObject({
      where: {
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: perfil.tipoDependencia,
        tipo_craving: perfil.tipoCraving,
      },
    });
    expect(argumento(tx.flujo_conversacion.create)).toMatchObject({
      data: { version: 4, estado: 'BORRADOR', creado_por: idActor },
    });
    expect(argumento(tx.auditoria_arboles.create)).toMatchObject({
      data: { id_flujo: idFlujo, id_actor: idActor, accion: 'CREAR_FLUJO' },
    });
    expect(prisma.$transaction.mock.calls).toHaveLength(1);
  });

  it('rechaza una combinación inválida antes de escribir', async () => {
    await expect(
      repository.crearFlujoPersonalizado({
        nombre: 'Árbol inválido',
        tipoDependencia: 'BAJA' as TipoDependenciaClinica,
        tipoCraving: perfil.tipoCraving,
        creadoPor: idActor,
      }),
    ).rejects.toBeInstanceOf(PerfilClinicoArbolInvalidoException);
    expect(tx.flujo_conversacion.create.mock.calls).toHaveLength(0);
  });

  it('archiva el publicado previo y publica el nuevo en una transacción', async () => {
    tx.flujo_conversacion.findFirst.mockResolvedValue(
      fila(idAnterior, EstadoFlujoConversacional.PUBLICADO, 1),
    );
    tx.flujo_conversacion.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id_flujo: string };
        data: { estado: EstadoFlujoConversacional };
      }) => Promise.resolve(fila(where.id_flujo, data.estado)),
    );

    const publicado = await repository.publicarPersonalizado(idFlujo, idActor);

    expect(publicado.estado).toBe(EstadoFlujoConversacional.PUBLICADO);
    expect(argumento(tx.flujo_conversacion.update)).toMatchObject({
      where: { id_flujo: idAnterior },
      data: { estado: 'ARCHIVADO' },
    });
    expect(argumento(tx.flujo_conversacion.update, 1)).toMatchObject({
      where: { id_flujo: idFlujo },
      data: { estado: 'PUBLICADO' },
    });
    expect(
      tx.auditoria_arboles.create.mock.calls.map(
        (call: unknown[]) =>
          (call[0] as { data: { accion: string } }).data.accion,
      ),
    ).toEqual(['ARCHIVAR', 'PUBLICAR']);
    expect(prisma.$transaction.mock.calls).toHaveLength(1);
  });

  it('conserva el publicado previo si el nuevo árbol no tiene nodo inicial', async () => {
    tx.nodos.findMany.mockResolvedValue([]);

    await expect(
      repository.publicarPersonalizado(idFlujo, idActor),
    ).rejects.toBeInstanceOf(NodoInicialInexistenteException);
    expect(tx.flujo_conversacion.update.mock.calls).toHaveLength(0);
    expect(tx.auditoria_arboles.create.mock.calls).toHaveLength(0);
  });

  it('impide publicar directamente una versión archivada', async () => {
    tx.flujo_conversacion.findUnique.mockResolvedValue(
      fila(idFlujo, EstadoFlujoConversacional.ARCHIVADO),
    );

    await expect(
      repository.publicarPersonalizado(idFlujo, idActor),
    ).rejects.toBeInstanceOf(FlujoPersonalizadoArchivadoException);
    expect(tx.flujo_conversacion.update.mock.calls).toHaveLength(0);
  });

  it('retorna ausencia de resultado si no hay árbol publicado para el perfil', async () => {
    await expect(
      repository.buscarPublicadoPersonalizado(perfil),
    ).resolves.toBeNull();
    expect(argumento(tx.flujo_conversacion.findFirst)).toMatchObject({
      where: {
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: perfil.tipoDependencia,
        tipo_craving: perfil.tipoCraving,
        estado: 'PUBLICADO',
      },
    });
  });

  it('clona nodos, validaciones y transiciones con identificadores nuevos', async () => {
    const idNodoA = '00000000-0000-4000-8000-000000000010';
    const idNodoB = '00000000-0000-4000-8000-000000000011';
    const idNodoNuevoA = '00000000-0000-4000-8000-000000000020';
    const idNodoNuevoB = '00000000-0000-4000-8000-000000000021';
    const idValidacionNueva = '00000000-0000-4000-8000-000000000030';
    tx.flujo_conversacion.findUnique.mockResolvedValue(
      fila(idAnterior, EstadoFlujoConversacional.PUBLICADO, 1),
    );
    tx.flujo_conversacion.findFirst.mockResolvedValue({ version: 1 });
    tx.flujo_conversacion.create.mockResolvedValue(
      fila(idFlujo, EstadoFlujoConversacional.BORRADOR, 2),
    );
    tx.nodos.findMany.mockResolvedValue([nodo(idNodoA, true), nodo(idNodoB)]);
    tx.nodos.create
      .mockResolvedValueOnce({ id_nodo: idNodoNuevoA })
      .mockResolvedValueOnce({ id_nodo: idNodoNuevoB });
    tx.reglas_nodos.findMany.mockResolvedValue([
      {
        id_regla: '00000000-0000-4000-8000-000000000040',
        id_flujo: idAnterior,
        id_nodo_origen: idNodoA,
        id_nodo_destino: idNodoB,
        id_regla_validacion: '00000000-0000-4000-8000-000000000041',
        operador_condicion: 'IGUALDAD',
        valor_condicion: true,
        orden_evaluacion: 1,
        fecha_creacion: fecha,
        reglas_validaciones: {
          id_regla_validacion: '00000000-0000-4000-8000-000000000041',
          tipo_dato: 'TEXTO',
          obligatorio: true,
          valor_min: null,
          valor_max: null,
          formato_regex: null,
          valores_permitidos: [],
          mensaje_error: 'Respuesta requerida',
        },
      },
    ]);
    tx.reglas_validaciones.create.mockResolvedValue({
      id_regla_validacion: idValidacionNueva,
    });

    const nueva = await repository.clonarVersionPersonalizada(
      idAnterior,
      idActor,
    );

    expect(nueva.version).toBe(2);
    expect(tx.nodos.create.mock.calls).toHaveLength(2);
    expect(tx.reglas_validaciones.create.mock.calls).toHaveLength(1);
    expect(argumento(tx.reglas_nodos.create)).toMatchObject({
      data: {
        id_flujo: idFlujo,
        id_nodo_origen: idNodoNuevoA,
        id_nodo_destino: idNodoNuevoB,
        id_regla_validacion: idValidacionNueva,
      },
    });
    expect(argumento(tx.auditoria_arboles.create)).toMatchObject({
      data: {
        id_flujo: idFlujo,
        id_objeto: idAnterior,
        accion: 'CLONAR_VERSION',
      },
    });
    expect(prisma.$transaction.mock.calls).toHaveLength(1);
  });
});
