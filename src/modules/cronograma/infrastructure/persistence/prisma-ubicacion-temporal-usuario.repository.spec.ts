import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { FechaInicioUsuarioNoRegistradaException } from '../../domain/exeption/cronograma/fecha-inicio-usuario-no-registrada.exception';
import { PrismaUbicacionTemporalUsuarioRepository } from './prisma-ubicacion-temporal-usuario.repository';

describe('PrismaUbicacionTemporalUsuarioRepository (RF-22)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const fechaCalculo = new Date('2026-09-15T12:00:00.000Z');
  let consultaEjecutada: unknown;
  let resultadoQuery: unknown[] = [];
  let errorQuery: Error | undefined;
  const queryRaw = jest.fn((consulta: unknown): Promise<unknown[]> => {
    consultaEjecutada = consulta;
    if (errorQuery !== undefined) {
      return Promise.reject(errorQuery);
    }

    return Promise.resolve(resultadoQuery);
  });
  const prisma = { $queryRaw: queryRaw };
  const repository = new PrismaUbicacionTemporalUsuarioRepository(
    prisma as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    consultaEjecutada = undefined;
    resultadoQuery = [];
    errorQuery = undefined;
  });

  it('invoca la función SQL con parámetros y reconstruye la ubicación vigente', async () => {
    resultadoQuery = [
      {
        id_usuario: idUsuario,
        id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
        id_cronograma: '00000000-0000-4000-8000-000000000003',
        id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
        nombre_unidad: 'Semana 2',
        orden_unidad: 2,
        fecha_calculo: fechaCalculo,
        tiempo_efectivo_transcurrido_segundos: 604800,
        cronograma_finalizado: false,
        mensaje: null,
      },
    ];

    await expect(repository.calcular(idUsuario, fechaCalculo)).resolves.toEqual(
      expect.objectContaining({
        idUsuario,
        nombreUnidad: 'Semana 2',
        tiempoEfectivoTranscurridoSegundos: 604800,
        cronogramaFinalizado: false,
      }),
    );

    const consulta = consultaEjecutada as {
      strings: string[];
      values: unknown[];
    };
    expect(consulta.strings.join('')).toContain(
      'cronograma.fn_ubicacion_temporal_usuario',
    );
    expect(consulta.values).toEqual([idUsuario, fechaCalculo]);
  });

  it('reconstruye el resultado de cronograma finalizado', async () => {
    resultadoQuery = [
      {
        id_usuario: idUsuario,
        id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
        id_cronograma: '00000000-0000-4000-8000-000000000003',
        id_unidad_temporal: null,
        nombre_unidad: null,
        orden_unidad: null,
        fecha_calculo: fechaCalculo,
        tiempo_efectivo_transcurrido_segundos: 1814400,
        cronograma_finalizado: true,
        mensaje: 'El usuario ha completado la totalidad del cronograma.',
      },
    ];

    await expect(repository.calcular(idUsuario, fechaCalculo)).resolves.toEqual(
      expect.objectContaining({
        idUnidadTemporal: null,
        cronogramaFinalizado: true,
        mensaje: 'El usuario ha completado la totalidad del cronograma.',
      }),
    );
  });

  it.each([
    ['rf22_fecha_inicio_requerida', FechaInicioUsuarioNoRegistradaException],
    ['rf22_cronograma_sin_unidades', CronogramaSinUnidadesTemporalesException],
  ])('traduce %s a una excepción 422 segura', async (message, exception) => {
    errorQuery = Object.assign(new Error(message), {
      code: 'P2010',
      meta: { code: 'P0001', message },
    });

    await expect(
      repository.calcular(idUsuario, fechaCalculo),
    ).rejects.toBeInstanceOf(exception);
  });

  it('preserva errores desconocidos para que aplicación los oculte', async () => {
    const error = new Error('fallo interno sensible');
    errorQuery = error;

    await expect(repository.calcular(idUsuario, fechaCalculo)).rejects.toBe(
      error,
    );
  });
});
