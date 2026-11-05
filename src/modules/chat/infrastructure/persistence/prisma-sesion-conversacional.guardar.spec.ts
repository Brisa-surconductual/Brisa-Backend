import { PrismaService } from '../../../../../prisma/prisma.service';
import { SesionConversacional } from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { SesionActivaExistenteException } from '../../domain/exceptions';
import { PrismaSesionConversacionalRepository } from './prisma-sesion-conversacional.repository';

describe('PrismaSesionConversacionalRepository - guardar', () => {
  const buscarPorId = jest.fn();
  const buscarActiva = jest.fn();
  const crear = jest.fn();
  const actualizarSesion = jest.fn();
  const actualizarEstado = jest.fn();
  const bloquear = jest.fn();
  const transaccion = jest.fn();

  const tx = {
    $executeRaw: bloquear,
    chat_sesiones: {
      findUnique: buscarPorId,
      findFirst: buscarActiva,
      create: crear,
      update: actualizarSesion,
    },
    estado_sesiones: { update: actualizarEstado },
  };

  const prisma = { $transaction: transaccion } as unknown as PrismaService;
  const repository = new PrismaSesionConversacionalRepository(prisma);

  const fecha = new Date('2026-10-19T12:00:00Z');

  const sesion = SesionConversacional.iniciar(
    {
      idSesion: '00000000-0000-4000-8000-000000000004',
      idUsuario: '00000000-0000-4000-8000-000000000001',
      idFlujoConversacional: '00000000-0000-4000-8000-000000000002',
      versionArbolUtilizada: 1,
      modalidadActiva: ModalidadConversacional.GRUPAL,
      tipoDependencia: null,
      tipoCraving: null,
      idNodoInicial: '00000000-0000-4000-8000-000000000003',
    },
    fecha,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    transaccion.mockImplementation(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    );
  });

  it('crea la sesión y su estado cuando el usuario no tiene otra activa', async () => {
    buscarPorId.mockResolvedValue(null);
    buscarActiva.mockResolvedValue(null);

    await repository.guardar(sesion);

    expect(bloquear).toHaveBeenCalledTimes(1);
    expect(crear).toHaveBeenCalledWith({
      data: {
        id_sesion: sesion.idSesion,
        id_usuario: sesion.idUsuario,
        id_flujo_conversacional: sesion.idFlujoConversacional,
        version_arbol_utilizada: 1,
        modalidad_activa: ModalidadConversacional.GRUPAL,
        tipo_dependencia: null,
        tipo_craving: null,
        id_nodo_actual: sesion.idNodoActual,
        fecha_inicio: fecha,
        fecha_ultima_interaccion: fecha,
        estado_sesiones: { create: { estado_actual: 'ACTIVA' } },
      },
    });
  });

  it('rechaza una sesión nueva si el usuario ya tiene una activa o pausada', async () => {
    buscarPorId.mockResolvedValue(null);
    buscarActiva.mockResolvedValue({ id_sesion: 'otra' });

    await expect(repository.guardar(sesion)).rejects.toBeInstanceOf(
      SesionActivaExistenteException,
    );

    expect(crear).not.toHaveBeenCalled();
  });

  it('actualiza el estado y registra la reanudación de una sesión pausada', async () => {
    buscarPorId.mockResolvedValue({
      id_sesion: sesion.idSesion,
      estado_sesiones: { estado_actual: 'PAUSADA' },
    });

    await repository.guardar(sesion);

    expect(crear).not.toHaveBeenCalled();
    expect(bloquear).not.toHaveBeenCalled();
    expect(actualizarEstado).toHaveBeenCalledWith({
      where: { id_sesion: sesion.idSesion },
      data: {
        estado_actual: 'ACTIVA',
        fecha_actualizacion: expect.any(Date) as unknown,
        fecha_reanudacion: expect.any(Date) as unknown,
      },
    });
  });

  it('no marca reanudación si la sesión ya estaba activa', async () => {
    buscarPorId.mockResolvedValue({
      id_sesion: sesion.idSesion,
      estado_sesiones: { estado_actual: 'ACTIVA' },
    });

    await repository.guardar(sesion);

    expect(actualizarEstado).toHaveBeenCalledWith({
      where: { id_sesion: sesion.idSesion },
      data: {
        estado_actual: 'ACTIVA',
        fecha_actualizacion: expect.any(Date) as unknown,
      },
    });
  });

  it('propaga los errores de base de datos', async () => {
    transaccion.mockRejectedValueOnce(new Error('Error de base de datos'));

    await expect(repository.guardar(sesion)).rejects.toThrow(
      'Error de base de datos',
    );
  });

  describe('ERROR_CONFIGURACION (RF-26B)', () => {
    const conError = SesionConversacional.registrarErrorConfiguracion(
      {
        idSesion: '00000000-0000-4000-8000-000000000009',
        idUsuario: '00000000-0000-4000-8000-000000000001',
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
      },
      fecha,
    );

    it('registra la sesión sin flujo, versión ni nodo, aunque haya una activa', async () => {
      buscarPorId.mockResolvedValue(null);
      buscarActiva.mockResolvedValue(null);

      await repository.guardar(conError);

      expect(crear).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_sesion: conError.idSesion,
          modalidad_activa: ModalidadConversacional.PERSONALIZADA,
          tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
          tipo_craving: TipoCravingClinico.NEGATIVO,
          estado_sesiones: { create: { estado_actual: 'ERROR_CONFIGURACION' } },
        }),
      });
      const datos = crear.mock.calls[0][0].data as Record<string, unknown>;
      expect(datos).not.toHaveProperty('id_flujo_conversacional');
      expect(datos).not.toHaveProperty('id_nodo_actual');
      expect(datos).not.toHaveProperty('version_arbol_utilizada');
    });

    it('reutiliza la sesión con error del usuario en lugar de crear otra', async () => {
      buscarPorId.mockResolvedValue(null);
      buscarActiva.mockResolvedValue({ id_sesion: 'previa' });

      await repository.guardar(conError);

      expect(crear).not.toHaveBeenCalled();
      expect(actualizarSesion).toHaveBeenCalledWith({
        where: { id_sesion: 'previa' },
        data: expect.objectContaining({ fecha_ultima_interaccion: fecha }),
      });
      expect(actualizarEstado).toHaveBeenCalledTimes(1);
    });

    it('no se considera reanudable', () => {
      expect(conError.esReanudable()).toBe(false);
      expect(() => conError.reanudar()).toThrow();
    });
  });
});
