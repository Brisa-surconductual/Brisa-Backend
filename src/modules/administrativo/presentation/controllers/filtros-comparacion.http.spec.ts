import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import type { Server } from 'node:http';
import request from 'supertest';
import { CronogramaPort } from '../../../cronograma/application/ports/cronograma.port';
import { CsrfSessionGuard } from '../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from '../../application/ports/auditoria.port';
import type {
  ConsultaFuenteAgregada,
  ResultadoFuenteAgregada,
} from '../../application/ports/fuente-vista-agregada.port';
import { NarrativaAgregadaPort } from '../../application/ports/narrativa-agregada.port';
import { NotificacionesAgregadasPort } from '../../application/ports/notificaciones-agregadas.port';
import { SeguimientoAgregadoPort } from '../../application/ports/seguimiento-agregado.port';
import { AuditoriaService } from '../../application/services/auditoria.service';
import { CompararCohortesUseCase } from '../../application/use-cases/comparar-cohortes.use-case';
import { ConsultarCohortesUseCase } from '../../application/use-cases/consultar-cohortes.use-case';
import { ConsultarVistaAgregadaUseCase } from '../../application/use-cases/consultar-vista-agregada.use-case';
import { ConsultarVistaConductualUseCase } from '../../application/use-cases/consultar-vista-conductual.use-case';
import { ConsultarVistaNarrativaUseCase } from '../../application/use-cases/consultar-vista-narrativa.use-case';
import { ConsultarVistaNotificacionesUseCase } from '../../application/use-cases/consultar-vista-notificaciones.use-case';
import { ConsultarVistasFiltradasUseCase } from '../../application/use-cases/consultar-vistas-filtradas.use-case';
import { GestionarCohortesUseCase } from '../../application/use-cases/gestionar-cohortes.use-case';
import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import { CohortesRepository } from '../../domain/repositories/cohortes.repository';
import { VistasAgregadasRepository } from '../../domain/repositories/vistas-agregadas.repository';
import type { CohorteConsultada } from '../../domain/results/cohorte-consultada';
import { CAMPOS_FILTRO_AGREGADO } from '../../domain/results/filtros-agregados';
import { CohortesController } from './cohortes.controller';
import { VistaConductualController } from './vista-conductual.controller';
import { VistasAgregadasController } from './vistas-agregadas.controller';

const COHORTE = '3f6c2a1e-8b7d-4c53-9a21-5d0e7b9f4a10';
const HISTORICA = '4a7d3b2f-9c8e-4d64-8b32-6e1f8c0a5b21';
const PENDIENTE = '168453e9-28f0-4cf3-86ae-c7a63fc22edb';
const UNIDAD = '8a9b0c1d-2e3f-4a4b-8c5d-6e7f8a9b0c1d';
const CRONOGRAMA = '3978259a-35e4-4a8d-a625-3afd89aa963d';
const ACTOR = '0aa349a2-dbea-4d21-b29b-d0bd018ce675';
const FECHA = '2026-11-15T05:00:00Z';
const VISTAS = '/admin/cohortes/' + COHORTE + '/vistas';
const COMPARACION = '/admin/cohortes/comparacion';
const AUTORIZAR = { 'x-prueba-rol': 'ADMINISTRATIVO' };
const RANGO = { fecha_inicio: '2026-11-15', fecha_fin: '2026-11-15' };
const FILTROS = {
  ...RANGO,
  id_unidad_temporal: UNIDAD,
  modalidad_terapeutica: 'PERSONALIZADA',
};
const tx = {} as Prisma.TransactionClient;

function cohorte(
  id: string,
  estado: CohorteConsultada['estado'],
): CohorteConsultada {
  return {
    id_cohorte: id,
    estado,
    id_cronograma: CRONOGRAMA,
    nombre_cohorte: 'Cohorte ' + id.slice(0, 4),
    nombre_cronograma: 'Programa',
    fecha_inicio_programa: '2026-08-01',
    fecha_fin_programa: '2026-11-30',
    fecha_actualizacion: FECHA,
  };
}

function actualizada(id: string, datos: unknown): ResultadoFuenteAgregada {
  return { id_cohorte: id, estado: 'ACTUALIZADO', datos };
}

function agregado(n: number | null) {
  return {
    fecha_actualizacion: FECHA,
    total_usuarios_activos: n,
    distribucion_niveles_progreso: [
      { nivel: 'INICIAL', total_usuarios: 2, id_usuario: 'dato individual' },
    ],
    tasa_adherencia_promedio: 0.74,
    alertas_craving_pendientes: 99,
    correo_electronico: 'privado@example.invalid',
  };
}

const obtenerSeguimiento = jest.fn<
  Promise<ResultadoFuenteAgregada>,
  [string, ConsultaFuenteAgregada?]
>();
const obtenerNarrativa = jest.fn<
  Promise<ResultadoFuenteAgregada>,
  [string, ConsultaFuenteAgregada?]
>();
const obtenerNotificaciones = jest.fn<
  Promise<ResultadoFuenteAgregada>,
  [string, ConsultaFuenteAgregada?]
>();
const registrar = jest
  .fn<Promise<void>, [Prisma.TransactionClient, RegistroAuditoria, boolean]>()
  .mockResolvedValue(undefined);
const consultarCohortes = jest.fn().mockResolvedValue([]);
const obtenerCronograma = jest.fn().mockResolvedValue(CRONOGRAMA);
const listarUnidades = jest.fn().mockResolvedValue([UNIDAD]);
const guardar = jest.fn().mockResolvedValue(true);
const obtenerUltimo = jest.fn().mockResolvedValue(null);
const suprimir = jest.fn().mockResolvedValue(undefined);

function autenticar(ctx: ExecutionContext): boolean {
  const req = ctx.switchToHttp().getRequest<AuthenticatedSessionRequest>();
  const rol = req.header('x-prueba-rol');
  if (!rol) throw new UnauthorizedException();
  req.autenticacion = {
    usuario: { id_usuario: ACTOR, rol },
    sesion: { id_sesion: ACTOR, alcance_sesion: 'COMPLETA' },
  } as AuthenticatedSessionRequest['autenticacion'];
  return true;
}

jest.setTimeout(60_000);

describe('RF-135 y RF-143 por HTTP', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer() as Server);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [
        CohortesController,
        VistasAgregadasController,
        VistaConductualController,
      ],
      providers: [
        ConsultarVistaAgregadaUseCase,
        ConsultarVistaConductualUseCase,
        ConsultarVistaNarrativaUseCase,
        ConsultarVistaNotificacionesUseCase,
        ConsultarVistasFiltradasUseCase,
        CompararCohortesUseCase,
        AuditoriaService,
        { provide: ConsultarCohortesUseCase, useValue: {} },
        { provide: GestionarCohortesUseCase, useValue: {} },
        {
          provide: BitacoraRepository,
          useValue: {
            enTransaccion: <T>(
              operacion: (tx: Prisma.TransactionClient) => Promise<T>,
            ) => operacion(tx),
            insertar: registrar,
          },
        },
        { provide: ColaAuditoriaPort, useValue: {} },
        {
          provide: CohortesRepository,
          useValue: { consultarVigentes: consultarCohortes },
        },
        {
          provide: VistasAgregadasRepository,
          useValue: {
            obtenerCronogramaCohorteActiva: obtenerCronograma,
            guardar,
            obtenerUltimo,
            suprimir,
          },
        },
        {
          provide: CronogramaPort,
          useValue: { listarIdsUnidadesEnOrden: listarUnidades },
        },
        {
          provide: SeguimientoAgregadoPort,
          useValue: {
            filtrosSoportados: CAMPOS_FILTRO_AGREGADO,
            obtener: obtenerSeguimiento,
          },
        },
        {
          provide: NarrativaAgregadaPort,
          useValue: {
            filtrosSoportados: CAMPOS_FILTRO_AGREGADO,
            obtener: obtenerNarrativa,
          },
        },
        {
          provide: NotificacionesAgregadasPort,
          useValue: {
            filtrosSoportados: CAMPOS_FILTRO_AGREGADO.filter(
              (campo) => campo !== 'modalidad_terapeutica',
            ),
            obtener: obtenerNotificaciones,
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = modulo.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    obtenerSeguimiento
      .mockReset()
      .mockImplementation((id) =>
        Promise.resolve(actualizada(id, agregado(12))),
      );
    obtenerNarrativa.mockReset().mockImplementation((id) =>
      Promise.resolve(
        actualizada(id, {
          fecha_actualizacion: FECHA,
          total_usuarios_con_logros: 3,
        }),
      ),
    );
    obtenerNotificaciones.mockReset().mockImplementation((id) =>
      Promise.resolve(
        actualizada(id, {
          fecha_actualizacion: FECHA,
          total_notificaciones_enviadas: 3,
        }),
      ),
    );
    consultarCohortes
      .mockReset()
      .mockResolvedValue([
        cohorte(COHORTE, 'ACTIVA'),
        cohorte(HISTORICA, 'INACTIVA'),
        cohorte(PENDIENTE, 'ACTIVA'),
      ]);
  });

  it('exige sesión administrativa para vistas y comparación', async () => {
    await http().get(VISTAS).expect(401);
    await http().get(COMPARACION).set('x-prueba-rol', 'ESTUDIANTE').expect(403);
    expect(obtenerSeguimiento).not.toHaveBeenCalled();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('combina los filtros por fuente y no bloquea las demás vistas si una falla', async () => {
    obtenerNarrativa.mockRejectedValueOnce(new Error('simulación'));
    const respuesta = await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ ...FILTROS, vista_objetivo: 'TODAS' })
      .expect(200);
    expect(respuesta.body).toMatchObject({
      filtros_aplicados: FILTROS,
      vistas: {
        CONDUCTUAL: { estado: 'DISPONIBLE', filtros_omitidos: [] },
        NARRATIVA: { estado: 'NO_DISPONIBLE', datos: null },
        NOTIFICACIONES: {
          estado: 'DISPONIBLE',
          filtros_omitidos: ['modalidad_terapeutica'],
          advertencia:
            'El filtro de modalidad terapéutica no está disponible para la vista de notificaciones.',
        },
      },
    });
    expect(obtenerSeguimiento).toHaveBeenCalledWith(COHORTE, {
      filtros: FILTROS,
    });
    expect(obtenerNarrativa).toHaveBeenCalledWith(COHORTE, {
      filtros: FILTROS,
    });
    expect(obtenerNotificaciones).toHaveBeenCalledWith(COHORTE, {
      filtros: { ...RANGO, id_unidad_temporal: UNIDAD },
    });
    expect(listarUnidades).toHaveBeenCalledTimes(1);
    expect(guardar).not.toHaveBeenCalled();
    expect(obtenerUltimo).not.toHaveBeenCalled();
    expect(registrar.mock.calls.map(([, evento]) => evento.accion)).toEqual([
      'CONSULTA_AGREGADA',
    ]);
  });

  it('consulta solo la vista elegida y conserva la consulta legacy sin filtros', async () => {
    const unica = await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ vista_objetivo: 'NARRATIVA', modalidad_terapeutica: 'TODAS' })
      .expect(200);
    expect(unica.body).toMatchObject({
      filtros_aplicados: {},
      vistas: { NARRATIVA: { estado: 'DISPONIBLE' } },
    });
    expect(obtenerSeguimiento).not.toHaveBeenCalled();
    expect(obtenerNotificaciones).not.toHaveBeenCalled();
    await http()
      .get('/admin/cohortes/' + COHORTE + '/vista-agregada')
      .set(AUTORIZAR)
      .expect(200);
    expect(obtenerSeguimiento).toHaveBeenLastCalledWith(COHORTE);
    expect(guardar).toHaveBeenCalledTimes(2);
    const individual = await http()
      .get(VISTAS + '/conductual')
      .set(AUTORIZAR)
      .query(RANGO)
      .expect(200);
    expect(individual.body).toMatchObject({
      filtros_aplicados: RANGO,
      filtros_omitidos: [],
    });
    expect(guardar).toHaveBeenCalledTimes(2);
  });

  it('rechaza fechas inválidas y unidades que no pertenecen al cronograma antes de consultar fuentes', async () => {
    await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ fecha_inicio: '2026-02-30' })
      .expect(400)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'RANGO_FECHAS_INVALIDO' }),
      );
    await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ ...RANGO, fecha_fin: '2026-10-01' })
      .expect(400);
    await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ id_unidad_temporal: ACTOR })
      .expect(404)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'UNIDAD_TEMPORAL_NO_ENCONTRADA' }),
      );
    expect(obtenerSeguimiento).not.toHaveBeenCalled();
  });

  it('devuelve vacío funcional o indisponibilidad acotada sin mezclar respaldos sin filtrar', async () => {
    obtenerSeguimiento
      .mockResolvedValueOnce({ id_cohorte: COHORTE, estado: 'PENDIENTE' })
      .mockResolvedValueOnce({ id_cohorte: COHORTE, estado: 'NO_DISPONIBLE' });
    const vacia = await http()
      .get(VISTAS + '/conductual')
      .set(AUTORIZAR)
      .query(RANGO)
      .expect(200);
    expect(vacia.body).toMatchObject({
      datos: null,
      filtros_aplicados: RANGO,
      estado_agregacion: 'PENDIENTE',
    });
    await http()
      .get(VISTAS + '/conductual')
      .set(AUTORIZAR)
      .query(RANGO)
      .expect(503)
      .expect(({ body }) =>
        expect(body).toMatchObject({ datos: null, filtros_aplicados: RANGO }),
      );
    expect(obtenerUltimo).not.toHaveBeenCalled();
  });

  it('aplica la supresión de la fuente al respaldo general únicamente en consultas sin filtros', async () => {
    const suprimida = { id_cohorte: COHORTE, estado: 'SUPRIMIDO' as const };
    obtenerSeguimiento
      .mockResolvedValueOnce(suprimida)
      .mockResolvedValueOnce(suprimida);

    await http()
      .get(VISTAS + '/conductual')
      .set(AUTORIZAR)
      .query(RANGO)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          datos: null,
          motivo_sin_datos: 'AGREGADO_SUPRIMIDO',
        }),
      );
    expect(suprimir).not.toHaveBeenCalled();

    await http()
      .get(VISTAS)
      .set(AUTORIZAR)
      .query({ vista_objetivo: 'CONDUCTUAL' })
      .expect(200);
    expect(suprimir).toHaveBeenCalledTimes(1);
    expect(suprimir).toHaveBeenCalledWith(tx, COHORTE, 'CONDUCTUAL');
  });

  it('detiene la comparación si el registro de auditoría falla', async () => {
    registrar.mockRejectedValueOnce(new Error('bitácora no disponible'));
    const respuesta = await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({ ids: [COHORTE, HISTORICA].join(',') })
      .expect(500);
    expect(respuesta.body).toMatchObject({
      codigo: 'ERROR_REGISTRO_AUDITORIA',
    });
    expect(respuesta.text).not.toContain('tasa_adherencia_promedio');
  });

  it('compara cohortes históricas y actuales, respeta N < 5 y omite cualquier detalle individual', async () => {
    obtenerSeguimiento.mockImplementation((id) =>
      id === PENDIENTE
        ? Promise.resolve({ id_cohorte: id, estado: 'PENDIENTE' })
        : Promise.resolve(actualizada(id, agregado(id === HISTORICA ? 4 : 5))),
    );
    const ids = [HISTORICA, COHORTE, PENDIENTE];
    const respuesta = await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({
        ...RANGO,
        ids: ids.join(','),
        indicadores: 'PROGRESO,ADHERENCIA',
        drill_down: 'privado@example.invalid',
      })
      .expect(200);
    expect(respuesta.body).toMatchObject({
      indicadores: ['PROGRESO', 'ADHERENCIA'],
      cohortes: [
        {
          id_cohorte: HISTORICA,
          n: 4,
          suprimida: true,
          distribucion_niveles_progreso: null,
          tasa_adherencia_promedio: null,
        },
        {
          id_cohorte: COHORTE,
          n: 5,
          suprimida: false,
          distribucion_niveles_progreso: [{ nivel: 'INICIAL', total: 2 }],
          tasa_adherencia_promedio: 0.74,
        },
        { id_cohorte: PENDIENTE, n: null, fecha_actualizacion: null },
      ],
    });
    expect(respuesta.text).not.toMatch(
      /dato individual|privado@example|alertas_craving|drill_down|id_usuario/u,
    );
    expect(consultarCohortes).toHaveBeenCalledWith(tx, ids);
    for (const id of ids) {
      expect(obtenerSeguimiento).toHaveBeenCalledWith(id, {
        filtros: RANGO,
        incluirHistoricas: true,
      });
    }
    expect(
      registrar.mock.calls.map(([, evento]) => [
        evento.accion,
        evento.estado_accion,
      ]),
    ).toEqual([
      ['INTENTO_EXTRACCION_RESTRINGIDA', 'DENEGADA'],
      ['CONSULTA_AGREGADA', 'EXITOSA'],
    ]);
  });

  it('limita la selección a entre 2 y 5 cohortes distintas y responde 422 si ninguna tiene datos', async () => {
    await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({ ids: [COHORTE, COHORTE].join(',') })
      .expect(400)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'COHORTES_INSUFICIENTES' }),
      );
    await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({
        ids: [COHORTE, HISTORICA, PENDIENTE, UNIDAD, ACTOR, CRONOGRAMA].join(
          ',',
        ),
      })
      .expect(400);
    expect(obtenerSeguimiento).not.toHaveBeenCalled();

    obtenerSeguimiento.mockImplementation((id) =>
      Promise.resolve({ id_cohorte: id, estado: 'PENDIENTE' }),
    );
    await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({ ids: [COHORTE, HISTORICA].join(',') })
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'COHORTES_SIN_INDICADORES' }),
      );
    expect(obtenerSeguimiento).toHaveBeenCalledTimes(2);
  });

  it('no publica indicadores fuera de la selección o sin un tamaño verificable', async () => {
    obtenerSeguimiento.mockImplementation((id) =>
      Promise.resolve(actualizada(id, agregado(id === HISTORICA ? null : 5))),
    );
    const respuesta = await http()
      .get(COMPARACION)
      .set(AUTORIZAR)
      .query({ ids: [COHORTE, HISTORICA].join(','), indicadores: 'ADHERENCIA' })
      .expect(200);
    expect(respuesta.body).toMatchObject({
      cohortes: [
        {
          n: 5,
          suprimida: false,
          distribucion_niveles_progreso: null,
          tasa_adherencia_promedio: 0.74,
        },
        {
          n: null,
          suprimida: true,
          distribucion_niveles_progreso: null,
          tasa_adherencia_promedio: null,
        },
      ],
    });
  });
});
