import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { BitacoraRepository } from '../../ports/auditoria.port';
import type {
  InteraccionNotificacionesM07,
  NotificacionesIndividualPort,
  PeriodoNotificaciones,
} from '../../ports/notificaciones-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { ConsultarInteraccionNotificacionesUseCase } from './consultar-interaccion-notificaciones.use-case';

const CODIGO = 'P-7F3A91C2';
const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';
const PERIODO: PeriodoNotificaciones = {
  fecha_inicio: '2026-10-01',
  fecha_fin: '2026-11-22',
};
const TODO_EL_PROGRAMA: PeriodoNotificaciones = {
  fecha_inicio: null,
  fecha_fin: null,
};

const interaccionM07 = (
  cambios: Partial<InteraccionNotificacionesM07> = {},
): InteraccionNotificacionesM07 => ({
  id_usuario: ID_PARTICIPANTE,
  total_notificaciones_enviadas: 120,
  total_notificaciones_entregadas: 114,
  total_notificaciones_abiertas: 70,
  total_notificaciones_descartadas: 44,
  total_sesiones_desde_notificacion: 31,
  tasa_apertura: 0.61,
  tasa_conversion: 0.27,
  tasa_descarte: 'NO_CALCULABLE',
  ...cambios,
});

describe('ConsultarInteraccionNotificacionesUseCase (RF-131)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };

  const insertar = jest.fn<
    Promise<void>,
    [Prisma.TransactionClient, RegistroAuditoria, boolean]
  >();
  const buscarIdParticipante = jest.fn<
    Promise<string | null>,
    [Prisma.TransactionClient, string]
  >();
  const obtenerInteraccion = jest.fn<
    Promise<InteraccionNotificacionesM07 | null>,
    [string, PeriodoNotificaciones]
  >();

  const bitacora = {
    enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
      op(tx),
    insertar,
    listar: jest.fn(),
  } as unknown as BitacoraRepository;
  const repositorio = {
    buscarIdParticipante,
    buscarAlertasAtendidas: jest.fn(),
  } as unknown as SeguimientoIndividualRepository;
  const useCase = new ConsultarInteraccionNotificacionesUseCase(
    { obtenerInteraccion } satisfies NotificacionesIndividualPort,
    new SeguimientoIndividualService(repositorio),
    repositorio,
    new AuditoriaService(bitacora, { encolar: jest.fn() }),
  );

  const registros = () => insertar.mock.calls.map(([, registro]) => registro);
  const errorDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    return error as HttpException;
  };

  beforeEach(() => {
    insertar.mockReset().mockResolvedValue(undefined);
    buscarIdParticipante.mockReset().mockResolvedValue(ID_PARTICIPANTE);
    obtenerInteraccion.mockReset().mockResolvedValue(interaccionM07());
  });

  afterEach(() => jest.useRealTimers());

  it('devuelve la respuesta del contrato y audita CONSULTA_PARTICIPANTE ALTA con el periodo', async () => {
    await expect(useCase.execute(ctx, CODIGO, PERIODO)).resolves.toEqual({
      codigo_participante: CODIGO,
      periodo: PERIODO,
      total_notificaciones_enviadas: 120,
      total_notificaciones_entregadas: 114,
      total_notificaciones_abiertas: 70,
      total_notificaciones_descartadas: 44,
      total_sesiones_desde_notificacion: 31,
      tasa_apertura: 0.61,
      tasa_conversion: 0.27,
      tasa_descarte: 'NO_CALCULABLE',
      modo_consulta: 'SOLO_LECTURA',
    });
    expect(obtenerInteraccion).toHaveBeenCalledWith(ID_PARTICIPANTE, PERIODO);
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'CONSULTA_PARTICIPANTE',
        recurso_afectado: 'INTERACCION_NOTIFICACIONES_PARTICIPANTE',
        estado_accion: 'EXITOSA',
        severidad: 'ALTA',
        id_participante: ID_PARTICIPANTE,
        detalle: {
          consulta: 'INTERACCION_NOTIFICACIONES',
          codigo_participante: CODIGO,
          fecha_inicio: '2026-10-01',
          fecha_fin: '2026-11-22',
        },
      }),
    ]);
  });

  it('sin fechas consulta todo el programa (periodo null)', async () => {
    const respuesta = await useCase.execute(ctx, CODIGO, TODO_EL_PROGRAMA);
    expect(respuesta?.periodo).toEqual(TODO_EL_PROGRAMA);
    expect(obtenerInteraccion).toHaveBeenCalledWith(
      ID_PARTICIPANTE,
      TODO_EL_PROGRAMA,
    );
  });

  it('hubo envíos pero ninguna entrega: 200 con todas las tasas NO_CALCULABLE', async () => {
    obtenerInteraccion.mockResolvedValue(
      interaccionM07({
        total_notificaciones_enviadas: 6,
        total_notificaciones_entregadas: 0,
        total_notificaciones_abiertas: 0,
        total_notificaciones_descartadas: 0,
        total_sesiones_desde_notificacion: 0,
        // Aunque M07 enviara 0, con denominador cero no es calculable.
        tasa_apertura: 0,
        tasa_conversion: null,
        tasa_descarte: 'NO_CALCULABLE',
      }),
    );
    await expect(useCase.execute(ctx, CODIGO, PERIODO)).resolves.toMatchObject({
      total_notificaciones_enviadas: 6,
      tasa_apertura: 'NO_CALCULABLE',
      tasa_conversion: 'NO_CALCULABLE',
      tasa_descarte: 'NO_CALCULABLE',
    });
  });

  it('la conversión no es calculable si no hubo aperturas (denominador de RF-100)', async () => {
    obtenerInteraccion.mockResolvedValue(
      interaccionM07({
        total_notificaciones_abiertas: 0,
        tasa_apertura: 0,
        tasa_conversion: 0,
        tasa_descarte: 0.39,
      }),
    );
    await expect(useCase.execute(ctx, CODIGO, PERIODO)).resolves.toMatchObject({
      tasa_apertura: 0,
      tasa_conversion: 'NO_CALCULABLE',
      tasa_descarte: 0.39,
    });
  });

  it.each([
    ['M07 no tiene historial', null],
    [
      'no se envió ninguna notificación en el periodo',
      interaccionM07({
        total_notificaciones_enviadas: 0,
        total_notificaciones_entregadas: 0,
        total_notificaciones_abiertas: 0,
        total_notificaciones_descartadas: 0,
        total_sesiones_desde_notificacion: 0,
      }),
    ],
  ])(
    'devuelve null (204) si %s, y deja la consulta auditada',
    async (_caso, datos) => {
      obtenerInteraccion.mockResolvedValue(datos);
      await expect(useCase.execute(ctx, CODIGO, PERIODO)).resolves.toBeNull();
      expect(registros()[0]).toMatchObject({ estado_accion: 'EXITOSA' });
    },
  );

  it('409 si M07 responde por otro usuario, auditado como FALLIDA con severidad ALTA', async () => {
    obtenerInteraccion.mockResolvedValue(
      interaccionM07({ id_usuario: '00000000-0000-4000-8000-000000000007' }),
    );
    const error = await errorDe(useCase.execute(ctx, CODIGO, PERIODO));
    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toMatchObject({
      codigo: 'INCONSISTENCIA_PARTICIPANTE',
    });
    expect(registros()).toEqual([
      expect.objectContaining({
        estado_accion: 'FALLIDA',
        severidad: 'ALTA',
        id_participante: ID_PARTICIPANTE,
      }),
    ]);
  });

  it('404 si el participante no existe, sin consultar M07', async () => {
    buscarIdParticipante.mockResolvedValue(null);
    const error = await errorDe(useCase.execute(ctx, CODIGO, PERIODO));
    expect(error.getStatus()).toBe(404);
    expect(obtenerInteraccion).not.toHaveBeenCalled();
  });

  it('503 M07_NO_DISPONIBLE si M07 falla', async () => {
    obtenerInteraccion.mockRejectedValue(new Error('caído'));
    const error = await errorDe(useCase.execute(ctx, CODIGO, PERIODO));
    expect(error.getResponse()).toEqual({
      status: 503,
      codigo: 'M07_NO_DISPONIBLE',
      mensaje:
        'El módulo de notificaciones no se encuentra disponible en este momento.',
    });
    expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
  });

  it('503 si M07 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    obtenerInteraccion.mockReturnValue(new Promise(() => undefined));
    const resultado = useCase
      .execute(ctx, CODIGO, PERIODO)
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(2_000);
    const error = (await resultado) as HttpException;
    expect(error.getStatus()).toBe(503);
  });

  it('500 sin datos si la auditoría síncrona falla', async () => {
    insertar.mockRejectedValue(new Error('bitácora caída'));
    const error = await errorDe(useCase.execute(ctx, CODIGO, PERIODO));
    expect(error.getStatus()).toBe(500);
    expect(error.getResponse()).toMatchObject({
      codigo: 'ERROR_REGISTRO_AUDITORIA',
    });
  });

  it('500 con el mensaje de RF-131 ante un fallo inesperado', async () => {
    buscarIdParticipante.mockImplementation(() => {
      throw new TypeError('fallo inesperado');
    });
    const error = await errorDe(useCase.execute(ctx, CODIGO, PERIODO));
    expect(error.getResponse()).toEqual({
      status: 500,
      codigo: 'ERROR_CONSULTA_NOTIFICACIONES',
      mensaje:
        'No fue posible cargar el historial de interacción con notificaciones del participante.',
    });
  });
});
