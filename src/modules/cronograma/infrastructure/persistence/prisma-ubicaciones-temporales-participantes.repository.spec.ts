import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';
import { PrismaUbicacionesTemporalesParticipantesRepository } from './prisma-ubicaciones-temporales-participantes.repository';

describe('PrismaUbicacionesTemporalesParticipantesRepository', () => {
  const fechaCalculo = new Date('2026-09-15T12:00:00.000Z');
  let consultaEjecutada: unknown;
  let filas: Record<string, unknown>[] = [];
  const queryRaw = jest.fn((consulta: unknown) => {
    consultaEjecutada = consulta;
    return Promise.resolve(filas);
  });
  const repository = new PrismaUbicacionesTemporalesParticipantesRepository({
    $queryRaw: queryRaw,
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    filas = [];
    consultaEjecutada = undefined;
  });

  it('reutiliza la función individual en una única consulta paginada', async () => {
    filas = [crearFila()];

    const resultado = await repository.consultar({
      pagina: 1,
      limite: 50,
      fechaCalculo,
    });

    const consulta = consultaEjecutada as {
      strings: string[];
      values: unknown[];
    };
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(consulta.strings.join('')).toContain(
      'cronograma.fn_ubicacion_temporal_usuario',
    );
    expect(consulta.strings.join('')).toContain(
      'participantes_calculables AS MATERIALIZED',
    );
    expect(consulta.values).toContain(fechaCalculo);
    expect(resultado).toEqual(
      expect.objectContaining({
        total: 1,
        participantes: [
          expect.objectContaining({
            nombreUnidad: 'Semana 2',
            cronogramaFinalizado: false,
          }),
        ],
      }),
    );
  });

  it('representa sin error participantes sin cronograma y participantes en pausa', async () => {
    filas = [
      crearFila({
        total: 2n,
        id_cronograma_usuario: null,
        id_cronograma: null,
        nombre_cronograma: null,
        estado_cronograma: null,
        fecha_inicio_usuario: null,
        id_unidad_temporal: null,
        nombre_unidad: null,
        orden_unidad: null,
        fecha_inicio_unidad: null,
        fecha_fin_unidad: null,
        tiempo_efectivo_transcurrido_segundos: null,
        cronograma_finalizado: null,
        mensaje: 'El participante no tiene un cronograma asignado.',
      }),
      crearFila({
        total: 2n,
        id_usuario: '00000000-0000-4000-8000-000000000009',
        correo_electronico: 'pausa@brisa.test',
        en_pausa_administrativa: true,
      }),
    ];

    const resultado = await repository.consultar({
      pagina: 1,
      limite: 50,
      fechaCalculo,
    });

    expect(resultado.total).toBe(2);
    expect(resultado.participantes[0]).toEqual(
      expect.objectContaining({
        idCronograma: null,
        cronogramaFinalizado: null,
        mensaje: 'El participante no tiene un cronograma asignado.',
      }),
    );
    expect(resultado.participantes[1].enPausaAdministrativa).toBe(true);
  });

  it('conserva el total aunque la página solicitada no tenga filas', async () => {
    filas = [
      {
        ...crearFila(),
        total: 8n,
        id_usuario: null,
        correo_electronico: null,
        fecha_calculo: null,
      },
    ];

    await expect(
      repository.consultar({
        pagina: 3,
        limite: 50,
        fechaCalculo,
      }),
    ).resolves.toEqual({ total: 8, participantes: [] });
  });

  it('aplica filtros oficiales de cronograma, unidad y finalización', async () => {
    filas = [crearFila()];

    await repository.consultar({
      pagina: 1,
      limite: 20,
      fechaCalculo,
      idCronograma: '00000000-0000-4000-8000-000000000003',
      idUnidadTemporal: '00000000-0000-4000-8000-000000000004',
      cronogramaFinalizado: false,
    });

    const sql = (consultaEjecutada as { strings: string[] }).strings.join('');
    expect(sql).toContain('asignacion.id_cronograma =');
    expect(sql).toContain('ubicaciones.id_unidad_temporal =');
    expect(sql).toContain('ubicaciones.cronograma_finalizado =');
  });

  function crearFila(
    cambios: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      total: 1n,
      id_usuario: '00000000-0000-4000-8000-000000000001',
      correo_electronico: 'participante@brisa.test',
      id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
      id_cronograma: '00000000-0000-4000-8000-000000000003',
      nombre_cronograma: 'Cronograma base',
      estado_cronograma: EstadoCronograma.ACTIVO,
      fecha_inicio_usuario: new Date('2026-09-08T00:00:00.000Z'),
      id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
      nombre_unidad: 'Semana 2',
      orden_unidad: 2,
      fecha_inicio_unidad: new Date('2026-01-08T00:00:00.000Z'),
      fecha_fin_unidad: new Date('2026-01-15T00:00:00.000Z'),
      fecha_calculo: fechaCalculo,
      tiempo_efectivo_transcurrido_segundos: 604800,
      cronograma_finalizado: false,
      en_pausa_administrativa: false,
      mensaje: null,
      ...cambios,
    };
  }
});
