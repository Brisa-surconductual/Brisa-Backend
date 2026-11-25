import { HttpException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../../domain/entities/auditoria/registro-auditoria.entity';
import type { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { BitacoraRepository } from '../../ports/auditoria.port';
import type {
  ListaAlertasDto,
  PerfilSeguimientoDto,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';
import { ConsultarHistorialAlertasUseCase } from './consultar-historial-alertas.use-case';
import { ConsultarPerfilSeguimientoUseCase } from './consultar-perfil-seguimiento.use-case';

const CODIGO = 'P-7F3A91C2';
const ID_PARTICIPANTE = 'e0000000-0000-4000-8000-000000000003';
const ALERTA_INACTIVIDAD = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const ALERTA_CRAVING = '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d';

const perfilM05 = (codigo = CODIGO): PerfilSeguimientoDto => ({
  codigo_participante: codigo,
  indicadores_adherencia: { tasa_adherencia: 0.68, dias_con_registro: 17 },
  indicadores_progreso: {
    nivel_progreso: 'EN_AVANCE',
    unidades_completadas: 4,
  },
  tendencia_consumo: 'REDUCCION',
  alertas_activas: [
    {
      id_alerta: ALERTA_INACTIVIDAD,
      tipo_alerta: 'INACTIVIDAD',
      fecha_generacion: '2026-11-20T14:00:00Z',
    },
  ],
  fecha_actualizacion: '2026-11-22T05:00:00Z',
});

const alertasM05 = (codigo = CODIGO): ListaAlertasDto => ({
  codigo_participante: codigo,
  items: [
    {
      id_alerta: ALERTA_CRAVING,
      tipo_alerta: 'CRAVING_ELEVADO',
      fuente_alerta: 'RF-63',
      fecha_generacion: '2026-11-12T22:15:00Z',
    },
    {
      id_alerta: ALERTA_INACTIVIDAD,
      tipo_alerta: 'INACTIVIDAD',
      fuente_alerta: 'RF-68',
      fecha_generacion: '2026-11-20T14:00:00Z',
      estado_resolucion: 'ACTIVA',
      fecha_resolucion: null,
    },
  ],
  total: 2,
});

describe('Casos de uso de seguimiento individual (RF-128, RF-129)', () => {
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
  const buscarAlertasAtendidas = jest.fn<
    Promise<Map<string, Date>>,
    [Prisma.TransactionClient, string, string[]]
  >();
  const obtenerPerfilSeguimiento = jest.fn<
    Promise<PerfilSeguimientoDto | null>,
    [string]
  >();
  const obtenerAlertasParticipante = jest.fn<
    Promise<ListaAlertasDto | null>,
    [string, number, number]
  >();

  const bitacora = {
    enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
      op(tx),
    insertar,
    listar: jest.fn(),
  } as unknown as BitacoraRepository;
  const auditoria = new AuditoriaService(bitacora, {
    encolar: jest.fn(),
  });
  const repositorio = {
    buscarIdParticipante,
    buscarAlertasAtendidas,
  } as unknown as SeguimientoIndividualRepository;
  const puerto = {
    obtenerPerfilSeguimiento,
    obtenerAlertasParticipante,
  } as unknown as SeguimientoIndividualPort;
  const reglas = new SeguimientoIndividualService(repositorio);
  const perfil = new ConsultarPerfilSeguimientoUseCase(
    puerto,
    reglas,
    repositorio,
    auditoria,
  );
  const historial = new ConsultarHistorialAlertasUseCase(
    puerto,
    reglas,
    repositorio,
    auditoria,
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
    buscarAlertasAtendidas.mockReset().mockResolvedValue(new Map());
    obtenerPerfilSeguimiento.mockReset().mockResolvedValue(perfilM05());
    obtenerAlertasParticipante.mockReset().mockResolvedValue(alertasM05());
  });

  describe('perfil de seguimiento', () => {
    it('devuelve el perfil en solo lectura y audita CONSULTA_PARTICIPANTE con severidad ALTA', async () => {
      await expect(perfil.execute(ctx, CODIGO)).resolves.toEqual({
        ...perfilM05(),
        alertas_activas: [
          {
            id_alerta: ALERTA_INACTIVIDAD,
            tipo_alerta: 'INACTIVIDAD',
            fecha_generacion: '2026-11-20T14:00:00Z',
            estado_resolucion: 'ACTIVA',
          },
        ],
        modo_consulta: 'SOLO_LECTURA',
      });
      expect(registros()).toEqual([
        expect.objectContaining({
          accion: 'CONSULTA_PARTICIPANTE',
          recurso_afectado: 'PERFIL_SEGUIMIENTO_INDIVIDUAL',
          estado_accion: 'EXITOSA',
          severidad: 'ALTA',
          id_participante: ID_PARTICIPANTE,
        }),
      ]);
    });

    it('marca ATENDIDA una alerta activa gestionada localmente y la mantiene en la lista', async () => {
      buscarAlertasAtendidas.mockResolvedValue(
        new Map([[ALERTA_INACTIVIDAD, new Date('2026-11-21T08:00:00Z')]]),
      );
      const respuesta = await perfil.execute(ctx, CODIGO);
      expect(respuesta?.alertas_activas).toEqual([
        expect.objectContaining({
          id_alerta: ALERTA_INACTIVIDAD,
          estado_resolucion: 'ATENDIDA',
        }),
      ]);
    });

    it('devuelve null (204) si M05 no tiene perfil, y deja la consulta auditada', async () => {
      obtenerPerfilSeguimiento.mockResolvedValue(null);
      await expect(perfil.execute(ctx, CODIGO)).resolves.toBeNull();
      expect(registros()[0]).toMatchObject({ estado_accion: 'EXITOSA' });
    });

    it('409 si M05 devuelve otro participante, auditado como FALLIDA con severidad ALTA', async () => {
      obtenerPerfilSeguimiento.mockResolvedValue(perfilM05('P-00000000'));
      const error = await errorDe(perfil.execute(ctx, CODIGO));
      expect(error.getStatus()).toBe(409);
      expect(error.getResponse()).toMatchObject({
        codigo: 'INCONSISTENCIA_PARTICIPANTE',
      });
      expect(registros()).toEqual([
        expect.objectContaining({
          accion: 'CONSULTA_PARTICIPANTE',
          estado_accion: 'FALLIDA',
          severidad: 'ALTA',
        }),
      ]);
    });

    it('503 si M05 no responde', async () => {
      obtenerPerfilSeguimiento.mockRejectedValue(new Error('caído'));
      const error = await errorDe(perfil.execute(ctx, CODIGO));
      expect(error.getStatus()).toBe(503);
      expect(error.getResponse()).toEqual({
        status: 503,
        codigo: 'M05_NO_DISPONIBLE',
        mensaje:
          'El módulo de seguimiento no se encuentra disponible en este momento.',
      });
      expect(registros()[0]).toMatchObject({ estado_accion: 'FALLIDA' });
    });

    it('404 si el participante no existe, sin consultar M05', async () => {
      buscarIdParticipante.mockResolvedValue(null);
      const error = await errorDe(perfil.execute(ctx, CODIGO));
      expect(error.getStatus()).toBe(404);
      expect(obtenerPerfilSeguimiento).not.toHaveBeenCalled();
    });

    it('500 sin datos si la auditoría síncrona falla', async () => {
      insertar.mockRejectedValue(new Error('bitácora caída'));
      const error = await errorDe(perfil.execute(ctx, CODIGO));
      expect(error.getStatus()).toBe(500);
      expect(error.getResponse()).toMatchObject({
        codigo: 'ERROR_REGISTRO_AUDITORIA',
      });
    });
  });

  describe('historial de alertas', () => {
    it('enriquece, ordena de la más reciente a la más antigua y pagina', async () => {
      buscarAlertasAtendidas.mockResolvedValue(
        new Map([[ALERTA_CRAVING, new Date('2026-11-13T09:00:00Z')]]),
      );

      await expect(
        historial.execute(ctx, CODIGO, { offset: 0, limit: 20 }),
      ).resolves.toEqual({
        items: [
          {
            id_alerta: ALERTA_INACTIVIDAD,
            tipo_alerta: 'INACTIVIDAD',
            fuente_alerta: 'RF-68',
            fecha_generacion: '2026-11-20T14:00:00Z',
            estado_resolucion: 'ACTIVA',
            fecha_resolucion: null,
          },
          {
            id_alerta: ALERTA_CRAVING,
            tipo_alerta: 'CRAVING_ELEVADO',
            fuente_alerta: 'RF-63',
            fecha_generacion: '2026-11-12T22:15:00Z',
            estado_resolucion: 'ATENDIDA',
            fecha_resolucion: '2026-11-13T09:00:00.000Z',
          },
        ],
        total: 2,
        offset: 0,
        limit: 20,
        modo_consulta: 'SOLO_LECTURA',
      });
      expect(obtenerAlertasParticipante).toHaveBeenCalledWith(CODIGO, 0, 20);
      expect(registros()[0]).toMatchObject({
        recurso_afectado: 'HISTORIAL_ALERTAS_PARTICIPANTE',
        severidad: 'ALTA',
        estado_accion: 'EXITOSA',
      });
    });

    it.each([
      ['M05 sin datos', null],
      ['página vacía', { codigo_participante: CODIGO, items: [], total: 0 }],
    ])('devuelve null (204) con %s', async (_caso, respuesta) => {
      obtenerAlertasParticipante.mockResolvedValue(respuesta);
      await expect(
        historial.execute(ctx, CODIGO, { offset: 0, limit: 20 }),
      ).resolves.toBeNull();
    });

    it('409 si las alertas son de otro participante', async () => {
      obtenerAlertasParticipante.mockResolvedValue(alertasM05('P-00000000'));
      const error = await errorDe(
        historial.execute(ctx, CODIGO, { offset: 0, limit: 20 }),
      );
      expect(error.getStatus()).toBe(409);
      expect(buscarAlertasAtendidas).not.toHaveBeenCalled();
    });

    it('503 si M05 no responde', async () => {
      obtenerAlertasParticipante.mockRejectedValue(new Error('caído'));
      const error = await errorDe(
        historial.execute(ctx, CODIGO, { offset: 0, limit: 20 }),
      );
      expect(error.getStatus()).toBe(503);
    });
  });
});
