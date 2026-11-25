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
import { ConsultarInteraccionNotificacionesUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-interaccion-notificaciones.use-case';
import { PermisoIndividualGuard } from '../../guards/permiso-individual.guard';
import {
  InteraccionNotificacionesController,
  MENSAJE_SIN_PERMISO_NOTIFICACIONES,
} from './interaccion-notificaciones.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const RUTA = '/admin/participantes/P-7F3A91C2/interaccion-notificaciones';

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

const interaccion = {
  codigo_participante: 'P-7F3A91C2',
  periodo: { fecha_inicio: '2026-10-01', fecha_fin: '2026-11-22' },
  total_notificaciones_enviadas: 120,
  total_notificaciones_entregadas: 114,
  total_notificaciones_abiertas: 70,
  total_notificaciones_descartadas: 44,
  total_sesiones_desde_notificacion: 31,
  tasa_apertura: 0.61,
  tasa_conversion: 0.27,
  tasa_descarte: 'NO_CALCULABLE',
  modo_consulta: 'SOLO_LECTURA',
};

describe('GET /admin/participantes/:codigo/interaccion-notificaciones (HTTP, RF-131)', () => {
  let app: INestApplication<App>;
  const consultar = jest.fn();
  const vigente = jest.fn();
  const registrarIntento = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [InteraccionNotificacionesController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        PermisoIndividualGuard,
        {
          provide: ConsultarInteraccionNotificacionesUseCase,
          useValue: { execute: consultar },
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
    consultar.mockReset().mockResolvedValue(interaccion);
    vigente.mockReset().mockResolvedValue(true);
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => app?.close());

  const consultarRuta = (ruta = RUTA) => request(app.getHttpServer()).get(ruta);

  it('200 con el contrato (NO_CALCULABLE incluido) y el periodo solicitado', async () => {
    const r = await consultarRuta(
      '/admin/participantes/p-7f3a91c2/interaccion-notificaciones?fecha_inicio=2026-10-01&fecha_fin=2026-11-22',
    )
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toEqual(interaccion);
    expect(consultar).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      'P-7F3A91C2',
      { fecha_inicio: '2026-10-01', fecha_fin: '2026-11-22' },
    );
  });

  it('sin fechas consulta todo el programa', async () => {
    await consultarRuta().expect(200);
    expect(consultar).toHaveBeenCalledWith(expect.anything(), 'P-7F3A91C2', {
      fecha_inicio: null,
      fecha_fin: null,
    });
  });

  it('acepta solo una de las dos fechas', async () => {
    await consultarRuta(`${RUTA}?fecha_inicio=2026-10-01`).expect(200);
    expect(consultar).toHaveBeenCalledWith(expect.anything(), 'P-7F3A91C2', {
      fecha_inicio: '2026-10-01',
      fecha_fin: null,
    });
  });

  it('exige al ADMINISTRATIVO el alcance ACCESO_INDIVIDUAL', async () => {
    await consultarRuta().expect(200);
    expect(vigente).toHaveBeenCalledWith(
      ID_ADMIN,
      { codigo: 'P-7F3A91C2' },
      'ACCESO_INDIVIDUAL',
    );
  });

  it('204 sin cuerpo si no hay historial', async () => {
    consultar.mockResolvedValue(null);
    const r = await consultarRuta().expect(204);
    expect(r.text).toBe('');
  });

  it.each([
    ['fecha con formato incorrecto', 'fecha_inicio=01-10-2026'],
    ['fecha inexistente', 'fecha_fin=2026-02-30'],
    ['fecha con hora', 'fecha_inicio=2026-10-01T00:00:00Z'],
    [
      'fecha_inicio posterior a fecha_fin',
      'fecha_inicio=2026-11-22&fecha_fin=2026-10-01',
    ],
    ['parámetro desconocido', 'semana=3'],
  ])('400 con %s, sin consultar', async (_caso, query) => {
    await consultarRuta(`${RUTA}?${query}`).expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('acepta un periodo de un solo día', async () => {
    await consultarRuta(
      `${RUTA}?fecha_inicio=2026-10-01&fecha_fin=2026-10-01`,
    ).expect(200);
  });

  it('403 SIN_PERMISO_INDIVIDUAL con el mensaje de RF-131 sin permiso vigente', async () => {
    vigente.mockResolvedValue(false);
    const r = await consultarRuta().expect(403);
    expect(r.body).toEqual({
      status: 403,
      codigo: 'SIN_PERMISO_INDIVIDUAL',
      mensaje: MENSAJE_SIN_PERMISO_NOTIFICACIONES,
    });
    expect(consultar).not.toHaveBeenCalled();
  });

  it('COORDINADOR_PSI no necesita permiso individual', async () => {
    await consultarRuta().set('x-test-role', 'COORDINADOR_PSI').expect(200);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('403 para un estudiante', async () => {
    await consultarRuta().set('x-test-role', 'ESTUDIANTE').expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each([
    ['INCONSISTENCIA_PARTICIPANTE' as const, 409],
    ['PARTICIPANTE_NO_ENCONTRADO' as const, 404],
    ['M07_NO_DISPONIBLE' as const, 503],
    ['ERROR_CONSULTA_NOTIFICACIONES' as const, 500],
  ])(
    '%s responde %i con { status, codigo, mensaje }',
    async (codigo, status) => {
      consultar.mockRejectedValue(new SeguimientoIndividualException(codigo));
      const r = await consultarRuta().expect(status);
      expect(r.body).toMatchObject({ status, codigo });
    },
  );
});
