import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { CronogramaActivoUsuarioNoEncontradoException } from '../../domain/exeption/cronograma-activo-usuario-no-encontrado.exception';
import { PrismaInformacionTemporalUsuarioRepository } from './prisma-informacion-temporal-usuario.repository';

describe('PrismaInformacionTemporalUsuarioRepository (RF-23)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
  let consultaEjecutada: unknown;
  let resultadoQuery: unknown[] = [];
  let errorQuery: Error | undefined;
  const queryRaw = jest.fn((consulta: unknown): Promise<unknown[]> => {
    consultaEjecutada = consulta;
    return errorQuery
      ? Promise.reject(errorQuery)
      : Promise.resolve(resultadoQuery);
  });
  const repository = new PrismaInformacionTemporalUsuarioRepository({
    $queryRaw: queryRaw,
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    consultaEjecutada = undefined;
    resultadoQuery = [];
    errorQuery = undefined;
  });

  it('ejecuta una sola función parametrizada y agrupa sus contenidos', async () => {
    resultadoQuery = [crearFila(1), crearFila(2)];

    const resultado = await repository.consultar(idUsuario, fechaConsulta);

    expect(resultado.ubicacionTemporal).toMatchObject({
      idUsuario,
      nombreUnidad: 'Semana 2',
    });
    expect(resultado.contenidosVigentes).toEqual([
      expect.objectContaining({ ordenContenido: 1 }),
      expect.objectContaining({ ordenContenido: 2 }),
    ]);

    const consulta = consultaEjecutada as {
      strings: string[];
      values: unknown[];
    };
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(consulta.strings.join('')).toContain(
      'cronograma.fn_informacion_temporal_usuario',
    );
    expect(consulta.values).toEqual([idUsuario, fechaConsulta]);
  });

  it('reconstruye la ubicación con una lista vacía si no hay contenido vigente', async () => {
    resultadoQuery = [crearFilaSinContenido()];

    const resultado = await repository.consultar(idUsuario, fechaConsulta);

    expect(resultado.ubicacionTemporal.idUsuario).toBe(idUsuario);
    expect(resultado.contenidosVigentes).toEqual([]);
  });

  it('traduce la ausencia de cronograma activo a HTTP 404', async () => {
    errorQuery = Object.assign(
      new Error('El usuario no tiene un cronograma activo asignado.'),
      {
        code: 'P2010',
        meta: {
          code: 'P0001',
          constraint: 'rf23_cronograma_activo_no_asignado',
        },
      },
    );

    await expect(
      repository.consultar(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(CronogramaActivoUsuarioNoEncontradoException);
  });

  it('rechaza filas de contenido estructuralmente incompletas', async () => {
    resultadoQuery = [{ ...crearFila(1), contenido_nombre_contenido: null }];

    await expect(
      repository.consultar(idUsuario, fechaConsulta),
    ).rejects.toThrow(
      'La función de información temporal retornó un contenido incompleto.',
    );
  });

  function crearFila(ordenContenido: number): Record<string, unknown> {
    return {
      ...crearUbicacion(),
      contenido_id_contenido: `00000000-0000-4000-8000-00000000000${ordenContenido + 4}`,
      contenido_id_contenido_cronograma: `00000000-0000-4000-8000-00000000000${ordenContenido + 6}`,
      contenido_nombre_contenido: `Contenido ${ordenContenido}`,
      contenido_tipo_contenido: TipoContenido.INFORMATIVO,
      contenido_id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
      contenido_nombre_unidad: 'Semana 2',
      contenido_orden_unidad: 2,
      contenido_orden_contenido: ordenContenido,
      contenido_fecha_inicio_disponibilidad: new Date(
        '2026-01-08T00:00:00.000Z',
      ),
      contenido_fecha_fin_disponibilidad: new Date('2026-01-15T00:00:00.000Z'),
      contenido_estado_disponibilidad: EstadoContenido.ACTIVO,
    };
  }

  function crearFilaSinContenido(): Record<string, unknown> {
    return {
      ...crearUbicacion(),
      contenido_id_contenido: null,
      contenido_id_contenido_cronograma: null,
      contenido_nombre_contenido: null,
      contenido_tipo_contenido: null,
      contenido_id_unidad_temporal: null,
      contenido_nombre_unidad: null,
      contenido_orden_unidad: null,
      contenido_orden_contenido: null,
      contenido_fecha_inicio_disponibilidad: null,
      contenido_fecha_fin_disponibilidad: null,
      contenido_estado_disponibilidad: null,
    };
  }

  function crearUbicacion(): Record<string, unknown> {
    return {
      ubicacion_id_usuario: idUsuario,
      ubicacion_id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
      ubicacion_id_cronograma: '00000000-0000-4000-8000-000000000003',
      ubicacion_id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
      ubicacion_nombre_unidad: 'Semana 2',
      ubicacion_orden_unidad: 2,
      fecha_calculo: fechaConsulta,
      tiempo_efectivo_transcurrido_segundos: 604800,
      cronograma_finalizado: false,
      mensaje: null,
    };
  }
});
