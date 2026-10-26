import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import { PrismaSesionConversacionalRepository } from './prisma-sesion-conversacional.repository';

describe('PrismaSesionConversacionalRepository - iniciarOReanudar', () => {
  const buscar = jest.fn();
  const crear = jest.fn();
  const actualizarEstado = jest.fn();
  const transaccion = jest.fn();

  const tx = {
    chat_sesiones: {
      findFirst: buscar,
      create: crear,
    },
    estado_sesiones: {
      update: actualizarEstado,
    },
  };

  const prisma = {
    $transaction: transaccion,
  } as unknown as PrismaService;

  const repository = new PrismaSesionConversacionalRepository(prisma);

  const datos = {
    idUsuario: '00000000-0000-4000-8000-000000000001',
    idFlujoConversacional: '00000000-0000-4000-8000-000000000002',
    versionArbolUtilizada: 1,
    modalidadActiva: ModalidadConversacional.GRUPAL,
    tipoDependencia: null,
    tipoCraving: null,
    idNodoInicial: '00000000-0000-4000-8000-000000000003',
  };

  const sesionBase = {
    id_sesion: '00000000-0000-4000-8000-000000000004',
    id_usuario: datos.idUsuario,
    id_flujo_conversacional: datos.idFlujoConversacional,
    version_arbol_utilizada: datos.versionArbolUtilizada,
    modalidad_activa: datos.modalidadActiva,
    tipo_dependencia: null,
    tipo_craving: null,
    id_nodo_actual: datos.idNodoInicial,
    fecha_inicio: new Date('2026-10-19T12:00:00Z'),
    fecha_ultima_interaccion: new Date('2026-10-19T12:00:00Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    transaccion.mockImplementation(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    );
  });

  it('crea una sesión y su estado en una transacción Serializable', async () => {
    buscar.mockResolvedValue(null);

    crear.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'ACTIVA' },
    });

    const resultado = await repository.iniciarOReanudar(datos);

    expect(resultado.reanudada).toBe(false);
    expect(resultado.sesion.estadoActual).toBe('ACTIVA');
    expect(resultado.sesion.idNodoActual).toBe(datos.idNodoInicial);

    expect(transaccion).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    expect(crear).toHaveBeenCalledWith({
      data: {
        id_usuario: datos.idUsuario,
        id_flujo_conversacional: datos.idFlujoConversacional,
        version_arbol_utilizada: datos.versionArbolUtilizada,
        modalidad_activa: datos.modalidadActiva,
        tipo_dependencia: null,
        tipo_craving: null,
        id_nodo_actual: datos.idNodoInicial,
        estado_sesiones: {
          create: { estado_actual: 'ACTIVA' },
        },
      },
      include: { estado_sesiones: true },
    });
  });

  it('recupera una sesión ACTIVA sin crear otra', async () => {
    buscar.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'ACTIVA' },
    });

    const resultado = await repository.iniciarOReanudar(datos);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.idSesion).toBe(sesionBase.id_sesion);
    expect(crear).not.toHaveBeenCalled();
    expect(actualizarEstado).not.toHaveBeenCalled();
  });

  it('reanuda una sesión PAUSADA conservando su nodo', async () => {
    buscar.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'PAUSADA' },
    });

    actualizarEstado.mockResolvedValue({
      estado_actual: 'ACTIVA',
    });

    const resultado = await repository.iniciarOReanudar(datos);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.estadoActual).toBe('ACTIVA');
    expect(resultado.sesion.idNodoActual).toBe(sesionBase.id_nodo_actual);
    expect(crear).not.toHaveBeenCalled();

    expect(actualizarEstado).toHaveBeenCalledWith({
      where: { id_sesion: sesionBase.id_sesion },
      data: {
        estado_actual: 'ACTIVA',
        fecha_reanudacion: expect.any(Date) as unknown,
        fecha_actualizacion: expect.any(Date) as unknown,
      },
    });
  });

  it('reintenta la transacción ante un conflicto P2034', async () => {
    const conflicto = new Prisma.PrismaClientKnownRequestError(
      'Conflicto de transacción',
      {
        code: 'P2034',
        clientVersion: '7.8.0',
      },
    );

    transaccion.mockRejectedValueOnce(conflicto);
    buscar.mockResolvedValue(null);

    crear.mockResolvedValue({
      ...sesionBase,
      estado_sesiones: { estado_actual: 'ACTIVA' },
    });

    const resultado = await repository.iniciarOReanudar(datos);

    expect(resultado.reanudada).toBe(false);
    expect(transaccion).toHaveBeenCalledTimes(2);
  });

  it('propaga los errores distintos de P2034 sin reintentar', async () => {
    transaccion.mockRejectedValueOnce(new Error('Error de base de datos'));

    await expect(repository.iniciarOReanudar(datos)).rejects.toThrow(
      'Error de base de datos',
    );

    expect(transaccion).toHaveBeenCalledTimes(1);
  });
});
