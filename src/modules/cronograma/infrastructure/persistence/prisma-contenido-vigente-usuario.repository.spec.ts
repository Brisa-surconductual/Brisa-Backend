import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { CronogramaUsuarioNoAsignadoException } from '../../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { FechaInicioUsuarioNoRegistradaException } from '../../domain/exeption/cronograma/fecha-inicio-usuario-no-registrada.exception';
import { PrismaContenidoVigenteUsuarioRepository } from './prisma-contenido-vigente-usuario.repository';

describe('PrismaContenidoVigenteUsuarioRepository (RF-21)', () => {
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
  const repository = new PrismaContenidoVigenteUsuarioRepository({
    $queryRaw: queryRaw,
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    consultaEjecutada = undefined;
    resultadoQuery = [];
    errorQuery = undefined;
  });

  it('invoca la función SQL con parámetros y reconstruye los contenidos', async () => {
    resultadoQuery = [crearFila()];

    await expect(
      repository.consultar(idUsuario, fechaConsulta),
    ).resolves.toEqual([
      expect.objectContaining({
        nombreContenido: 'Prevención de recaídas',
        ordenUnidad: 2,
        estadoDisponibilidad: EstadoContenido.ACTIVO,
      }),
    ]);

    const consulta = consultaEjecutada as {
      strings: string[];
      values: unknown[];
    };
    expect(consulta.strings.join('')).toContain(
      'cronograma.fn_contenido_vigente_usuario',
    );
    expect(consulta.values).toEqual([idUsuario, fechaConsulta]);
  });

  it('retorna vacío cuando la función no encuentra contenido vigente', async () => {
    await expect(
      repository.consultar(idUsuario, fechaConsulta),
    ).resolves.toEqual([]);
  });

  it.each([
    [
      'rf21_cronograma_usuario_no_asignado',
      CronogramaUsuarioNoAsignadoException,
    ],
    ['rf22_fecha_inicio_requerida', FechaInicioUsuarioNoRegistradaException],
    ['rf22_cronograma_sin_unidades', CronogramaSinUnidadesTemporalesException],
  ])('traduce %s a una excepción HTTP segura', async (message, exception) => {
    errorQuery = Object.assign(new Error(message), {
      code: 'P2010',
      meta: { code: 'P0001', message },
    });

    await expect(
      repository.consultar(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(exception);
  });

  function crearFila(): Record<string, unknown> {
    return {
      id_contenido: '00000000-0000-4000-8000-000000000002',
      id_contenido_cronograma: '00000000-0000-4000-8000-000000000003',
      nombre_contenido: 'Prevención de recaídas',
      tipo_contenido: TipoContenido.INFORMATIVO,
      id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
      nombre_unidad: 'Semana 2',
      orden_unidad: 2,
      orden_contenido: 1,
      fecha_inicio_disponibilidad: new Date('2026-01-08T00:00:00.000Z'),
      fecha_fin_disponibilidad: new Date('2026-01-15T00:00:00.000Z'),
      estado_disponibilidad: EstadoContenido.ACTIVO,
    };
  }
});
