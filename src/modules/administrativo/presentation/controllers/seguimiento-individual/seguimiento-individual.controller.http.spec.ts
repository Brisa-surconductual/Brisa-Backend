import {
  type ExecutionContext,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { SeguimientoIndividualException } from '../../../application/exceptions/seguimiento-individual.exception';
import { AuditoriaService } from '../../../application/services/auditoria.service';
import { VerificarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { ConsultarHistorialAlertasUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-historial-alertas.use-case';
import { ConsultarPerfilSeguimientoUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-perfil-seguimiento.use-case';
import { PermisoIndividualGuard } from '../../guards/permiso-individual.guard';
import {
  MENSAJE_SIN_PERMISO_SEGUIMIENTO,
  SeguimientoIndividualController,
} from './seguimiento-individual.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';

/** SessionAuthGuard simulado; el rol llega en la cabecera x-test-role. */
const autenticar = (c: ExecutionContext): boolean => {
  const req = c.switchToHttp().getRequest<{
    headers: Record<string, string>;
    autenticacion?: unknown;
  }>();
  req.autenticacion = {
    usuario: {
      id_usuario: ID_ADMIN,
      rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
    },
    sesion: {
      id_sesion: '00000000-0000-4000-8000-0000000a0701',
      alcance_sesion: 'COMPLETA',
    },
  };
  return true;
};

const perfil = {
  codigo_participante: 'P-7F3A91C2',
  indicadores_adherencia: { tasa_adherencia: 0.68, dias_con_registro: 17 },
  indicadores_progreso: {
    nivel_progreso: 'EN_AVANCE',
    unidades_completadas: 4,
  },
  tendencia_consumo: 'REDUCCION',
  alertas_activas: [],
  fecha_actualizacion: '2026-11-22T05:00:00Z',
  modo_consulta: 'SOLO_LECTURA',
};

describe('Seguimiento individual RF-128 / RF-129 (HTTP)', () => {
  let app: INestApplication<App>;
  const consultarPerfil = jest.fn();
  const consultarAlertas = jest.fn();
  const vigente = jest.fn();
  const registrarIntento = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [SeguimientoIndividualController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        PermisoIndividualGuard,
        {
          provide: ConsultarPerfilSeguimientoUseCase,
          useValue: { execute: consultarPerfil },
        },
        {
          provide: ConsultarHistorialAlertasUseCase,
          useValue: { execute: consultarAlertas },
        },
        {
          provide: VerificarPermisoIndividualUseCase,
          useValue: { execute: vigente },
        },
        { provide: AuditoriaService, useValue: { registrarIntento } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    consultarPerfil.mockReset().mockResolvedValue(perfil);
    consultarAlertas.mockReset().mockResolvedValue({
      items: [{ id_alerta: 'a1' }],
      total: 1,
      offset: 0,
      limit: 20,
      modo_consulta: 'SOLO_LECTURA',
    });
    vigente.mockReset().mockResolvedValue(true);
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => app?.close());

  const servidor = () => app.getHttpServer();

  it('200 con el perfil, sin caché, normalizando el código', async () => {
    const r = await request(servidor())
      .get('/admin/participantes/p-7f3a91c2/perfil-seguimiento')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toEqual(perfil);
    expect(consultarPerfil).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      'P-7F3A91C2',
    );
    expect(vigente).toHaveBeenCalledWith(
      ID_ADMIN,
      { codigo: 'P-7F3A91C2' },
      'ACCESO_INDIVIDUAL',
    );
  });

  it('200 con el historial y la paginación por defecto', async () => {
    await request(servidor())
      .get('/admin/participantes/P-7F3A91C2/alertas')
      .expect(200);
    expect(consultarAlertas).toHaveBeenCalledWith(
      expect.anything(),
      'P-7F3A91C2',
      { offset: 0, limit: 20 },
    );
  });

  it('pasa offset y limit de la consulta', async () => {
    await request(servidor())
      .get('/admin/participantes/P-7F3A91C2/alertas?offset=20&limit=5')
      .expect(200);
    expect(consultarAlertas).toHaveBeenCalledWith(
      expect.anything(),
      'P-7F3A91C2',
      { offset: 20, limit: 5 },
    );
  });

  it('400 con un limit fuera de rango', async () => {
    await request(servidor())
      .get('/admin/participantes/P-7F3A91C2/alertas?limit=500')
      .expect(400);
  });

  it.each([
    ['perfil-seguimiento', consultarPerfil],
    ['alertas', consultarAlertas],
  ])('204 sin cuerpo cuando %s no tiene datos', async (ruta, caso) => {
    caso.mockResolvedValue(null);
    const r = await request(servidor())
      .get(`/admin/participantes/P-7F3A91C2/${ruta}`)
      .expect(204);
    expect(r.text).toBe('');
  });

  it.each(['perfil-seguimiento', 'alertas'])(
    '403 SIN_PERMISO_INDIVIDUAL en %s para un ADMINISTRATIVO sin permiso vigente',
    async (ruta) => {
      vigente.mockResolvedValue(false);
      const r = await request(servidor())
        .get(`/admin/participantes/P-7F3A91C2/${ruta}`)
        .expect(403);
      expect(r.body).toEqual({
        status: 403,
        codigo: 'SIN_PERMISO_INDIVIDUAL',
        mensaje: MENSAJE_SIN_PERMISO_SEGUIMIENTO,
      });
      expect(consultarPerfil).not.toHaveBeenCalled();
      expect(consultarAlertas).not.toHaveBeenCalled();
    },
  );

  it('COORDINADOR_PSI no necesita permiso individual', async () => {
    await request(servidor())
      .get('/admin/participantes/P-7F3A91C2/perfil-seguimiento')
      .set('x-test-role', 'COORDINADOR_PSI')
      .expect(200);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('403 para un estudiante', async () => {
    await request(servidor())
      .get('/admin/participantes/P-7F3A91C2/perfil-seguimiento')
      .set('x-test-role', 'ESTUDIANTE')
      .expect(403);
    expect(consultarPerfil).not.toHaveBeenCalled();
  });

  it.each([
    [
      'INCONSISTENCIA_PARTICIPANTE' as const,
      409,
      'No fue posible mostrar la información solicitada.',
    ],
    [
      'M05_NO_DISPONIBLE' as const,
      503,
      'El módulo de seguimiento no se encuentra disponible en este momento.',
    ],
  ])(
    '%s responde %i con el cuerpo del contrato',
    async (codigo, status, mensaje) => {
      consultarPerfil.mockRejectedValue(
        new SeguimientoIndividualException(codigo),
      );
      const r = await request(servidor())
        .get('/admin/participantes/P-7F3A91C2/perfil-seguimiento')
        .expect(status);
      expect(r.body).toEqual({ status, codigo, mensaje });
    },
  );
});
