import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type {
  HistorialCuantitativoM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { ExportarSeguimientoIndividualUseCase } from './exportar-seguimiento-individual.use-case';

const CODIGO = 'P-7F3A91C2';
const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';
const A1 = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const A2 = '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d';
const A3 = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const historialM05 = (codigo = CODIGO): HistorialCuantitativoM05 => ({
  codigo_participante: codigo,
  unidades: [
    {
      orden_unidad_temporal: 2,
      nombre_unidad: 'Semana 2',
      fecha_inicio_unidad: '2026-10-12',
      fecha_fin_unidad: '2026-10-18',
      nivel_progreso: 'INICIAL',
      tasa_adherencia: 0.55,
      craving_promedio: 3.8,
      alertas: [],
    },
    {
      orden_unidad_temporal: 3,
      nombre_unidad: 'Semana 3',
      fecha_inicio_unidad: '2026-10-19',
      fecha_fin_unidad: '2026-10-25',
      nivel_progreso: 'EN_AVANCE',
      tasa_adherencia: 0.71,
      craving_promedio: 4.2,
      alertas: [
        // Atendida en M-8 (RF-147).
        { id_alerta: A1, estado_resolucion: 'ACTIVA' },
        // Informada como ATENDIDA por M05.
        { id_alerta: A2, estado_resolucion: 'ATENDIDA' },
        // Sigue activa.
        { id_alerta: A3 },
      ],
    },
  ],
});

describe('ExportarSeguimientoIndividualUseCase (RF-145)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-0000000000ad',
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
  const buscarAlertasAtendidas = jest.fn<
    Promise<Map<string, Date>>,
    [Prisma.TransactionClient, string, string[]]
  >();
  const obtenerHistorialCuantitativo = jest.fn<
    Promise<HistorialCuantitativoM05 | null>,
    [string]
  >();

  const repositorio = {
    buscarIdParticipante,
    buscarAlertasAtendidas,
  } as unknown as SeguimientoIndividualRepository;
  const useCase = new ExportarSeguimientoIndividualUseCase(
    { obtenerHistorialCuantitativo } as unknown as SeguimientoIndividualPort,
    new SeguimientoIndividualService(repositorio),
    repositorio,
    new AuditoriaService(
      {
        enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
          op(tx),
        insertar,
        listar: jest.fn(),
      },
      { encolar: jest.fn() },
    ),
  );

  const registros = () => insertar.mock.calls.map(([, registro]) => registro);
  const errorDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    const http = error as HttpException;
    return { status: http.getStatus(), cuerpo: http.getResponse() };
  };

  beforeEach(() => {
    insertar.mockReset().mockResolvedValue(undefined);
    buscarIdParticipante.mockReset().mockResolvedValue(ID_PARTICIPANTE);
    buscarAlertasAtendidas
      .mockReset()
      .mockResolvedValue(new Map([[A1, new Date('2026-10-26T10:00:00Z')]]));
    obtenerHistorialCuantitativo.mockReset().mockResolvedValue(historialM05());
  });

  afterEach(() => jest.useRealTimers());

  it('genera el CSV con columnas fijas y cuenta alertas atendidas con la prioridad de RF-129', async () => {
    const { nombre, contenido } = await useCase.ejecutar(ctx, CODIGO, []);
    expect(nombre).toMatch(/^seguimiento_individual_\d{8}\.csv$/u);
    const csv = contenido.toString('utf8');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.split('\r\n')).toEqual([
      '\uFEFForden_unidad_temporal,nombre_unidad,fecha_inicio_unidad,fecha_fin_unidad,nivel_progreso,tasa_adherencia,craving_promedio,alertas_generadas,alertas_atendidas',
      '2,Semana 2,2026-10-12,2026-10-18,INICIAL,0.55,3.8,0,0',
      '3,Semana 3,2026-10-19,2026-10-25,EN_AVANCE,0.71,4.2,3,2',
      '',
    ]);
    // Una sola consulta para todas las alertas del historial.
    expect(buscarAlertasAtendidas).toHaveBeenCalledTimes(1);
    expect(buscarAlertasAtendidas).toHaveBeenCalledWith(tx, ID_PARTICIPANTE, [
      A1,
      A2,
      A3,
    ]);
  });

  it('audita EXPORTACION_DATOS ALTA con tipo y detalle en la misma transacción, antes de devolver el archivo', async () => {
    const { nombre, contenido } = await useCase.ejecutar(ctx, CODIGO, []);
    expect(registros()).toEqual([
      expect.objectContaining({
        accion: 'EXPORTACION_DATOS',
        recurso_afectado: 'EXPORTACION_CSV_INDIVIDUAL',
        estado_accion: 'EXITOSA',
        severidad: 'ALTA',
        id_participante: ID_PARTICIPANTE,
        detalle: {
          tipo: 'EXPORTACION_INDIVIDUAL',
          nombre_archivo: nombre,
          tamano_bytes: contenido.length,
          unidades_exportadas: 2,
        },
      }),
    ]);
    expect(insertar.mock.calls[0][0]).toBe(tx);
  });

  it('si falla la auditoría: 500 EXPORTACION_ABORTADA y no devuelve el archivo', async () => {
    insertar.mockRejectedValue(new Error('bitácora caída'));
    await expect(errorDe(useCase.ejecutar(ctx, CODIGO, []))).resolves.toEqual({
      status: 500,
      cuerpo: {
        status: 500,
        codigo: 'EXPORTACION_ABORTADA',
        mensaje:
          'Ocurrió un error al procesar la exportación. La acción ha sido abortada por seguridad.',
      },
    });
  });

  it('lista blanca: los campos extra de M05 nunca llegan al CSV', async () => {
    const historial = historialM05();
    Object.assign(historial.unidades[0], {
      texto_diario: 'secreto',
      mensajes_chat: ['hola'],
      correo: 'persona@correo.com',
    });
    obtenerHistorialCuantitativo.mockResolvedValue(historial);
    const csv = (await useCase.ejecutar(ctx, CODIGO, [])).contenido.toString(
      'utf8',
    );
    expect(csv).not.toMatch(/secreto|hola|correo|P-7F3A91C2/u);
  });

  it('campos solicitados de más: exporta saneado y los deja en el detalle', async () => {
    const r = await useCase.ejecutar(ctx, CODIGO, [
      'include_pii',
      'texto_diario',
    ]);
    expect(r.contenido.toString('utf8')).not.toContain('texto_diario');
    expect(registros()[0]).toMatchObject({
      estado_accion: 'EXITOSA',
      detalle: { campos_descartados: ['include_pii', 'texto_diario'] },
    });
  });

  it('404 PARTICIPANTE_NO_ENCONTRADO sin consultar M05, auditado como FALLIDA', async () => {
    buscarIdParticipante.mockResolvedValue(null);
    await expect(errorDe(useCase.ejecutar(ctx, CODIGO, []))).resolves.toEqual({
      status: 404,
      cuerpo: {
        status: 404,
        codigo: 'PARTICIPANTE_NO_ENCONTRADO',
        mensaje: 'El participante solicitado no existe en el sistema.',
      },
    });
    expect(obtenerHistorialCuantitativo).not.toHaveBeenCalled();
    expect(registros()[0]).toMatchObject({
      accion: 'EXPORTACION_DATOS',
      estado_accion: 'FALLIDA',
      severidad: 'ALTA',
    });
  });

  it('409 INCONSISTENCIA_PARTICIPANTE si M05 responde por otro participante', async () => {
    obtenerHistorialCuantitativo.mockResolvedValue(historialM05('P-00000000'));
    await expect(
      errorDe(useCase.ejecutar(ctx, CODIGO, [])),
    ).resolves.toMatchObject({
      status: 409,
      cuerpo: { codigo: 'INCONSISTENCIA_PARTICIPANTE' },
    });
    expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
  });

  it.each([
    ['M05 no tiene datos', null],
    ['M05 no tiene unidades', { codigo_participante: CODIGO, unidades: [] }],
  ])('422 SIN_INDICADORES si %s', async (_caso, historial) => {
    obtenerHistorialCuantitativo.mockResolvedValue(historial);
    await expect(
      errorDe(useCase.ejecutar(ctx, CODIGO, [])),
    ).resolves.toMatchObject({
      status: 422,
      cuerpo: { codigo: 'SIN_INDICADORES' },
    });
  });

  it('503 M05_NO_DISPONIBLE si M05 falla', async () => {
    obtenerHistorialCuantitativo.mockRejectedValue(new Error('caído'));
    await expect(
      errorDe(useCase.ejecutar(ctx, CODIGO, [])),
    ).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M05_NO_DISPONIBLE' },
    });
  });

  it('503 si M05 no responde dentro del tiempo límite', async () => {
    jest.useFakeTimers();
    obtenerHistorialCuantitativo.mockReturnValue(new Promise(() => undefined));
    const resultado = errorDe(useCase.ejecutar(ctx, CODIGO, []));
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(resultado).resolves.toMatchObject({ status: 503 });
  });

  it('500 EXPORTACION_ABORTADA ante un error inesperado', async () => {
    buscarAlertasAtendidas.mockRejectedValue(new TypeError('fallo'));
    await expect(
      errorDe(useCase.ejecutar(ctx, CODIGO, [])),
    ).resolves.toMatchObject({
      status: 500,
      cuerpo: { codigo: 'EXPORTACION_ABORTADA' },
    });
  });
});
