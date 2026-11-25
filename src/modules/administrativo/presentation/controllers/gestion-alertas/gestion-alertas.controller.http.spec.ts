import {
  type ExecutionContext,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { GestionAlertaException } from '../../../application/exceptions/gestion-alerta.exception';
import { AuditoriaService } from '../../../application/services/auditoria.service';
import { MarcarAlertaAtendidaUseCase } from '../../../application/use-cases/gestion-alertas/marcar-alerta-atendida.use-case';
import { VerificarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { PermisoIndividualGuard } from '../../guards/permiso-individual.guard';
import {
  GestionAlertasController,
  MENSAJE_SIN_PERMISO_GESTION_ALERTAS,
} from './gestion-alertas.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const ID_ALERTA = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const RUTA = `/admin/participantes/P-7F3A91C2/alertas/${ID_ALERTA}/atender`;
const MOTIVO = 'Se contactó al participante y se agendó una sesión.';

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

/** CsrfSessionGuard simulado: exige la cabecera X-CSRF-Token. */
const csrf = (c: ExecutionContext): boolean =>
  Boolean(
    c.switchToHttp().getRequest<{ headers: Record<string, string> }>().headers[
      'x-csrf-token'
    ],
  );

describe('POST /admin/participantes/:codigo/alertas/:id_alerta/atender (HTTP, RF-147)', () => {
  let app: INestApplication<App>;
  const marcar = jest.fn();
  const vigente = jest.fn();
  const registrarIntento = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [GestionAlertasController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        PermisoIndividualGuard,
        { provide: MarcarAlertaAtendidaUseCase, useValue: { execute: marcar } },
        {
          provide: VerificarPermisoIndividualUseCase,
          useValue: { execute: vigente },
        },
        { provide: AuditoriaService, useValue: { registrarIntento } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: csrf })
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
    marcar.mockReset().mockResolvedValue({
      id_alerta: ID_ALERTA,
      tipo_alerta: 'INACTIVIDAD',
      estado_resolucion: 'ATENDIDA',
      fecha_resolucion: '2026-11-25T15:00:00.000Z',
      motivo: MOTIVO,
    });
    vigente.mockReset().mockResolvedValue(true);
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => app?.close());

  const atender = (body: object = { motivo: MOTIVO }, ruta = RUTA) =>
    request(app.getHttpServer())
      .post(ruta)
      .set('X-CSRF-Token', 'token')
      .send(body);

  it('200 con la alerta atendida, normalizando el código', async () => {
    const r = await atender(
      { motivo: `  ${MOTIVO}  ` },
      `/admin/participantes/p-7f3a91c2/alertas/${ID_ALERTA}/atender`,
    )
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toMatchObject({ estado_resolucion: 'ATENDIDA' });
    expect(marcar).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      'P-7F3A91C2',
      ID_ALERTA,
      MOTIVO,
    );
  });

  it.each([
    ['sin motivo', {}],
    ['motivo vacío', { motivo: '   ' }],
    ['motivo corto', { motivo: 'revisado' }],
    ['motivo largo', { motivo: 'a'.repeat(501) }],
    ['motivo no textual', { motivo: 42 }],
    ['campos extra', { motivo: MOTIVO, estado: 'ACTIVA' }],
  ])('400 %s, sin ejecutar la acción', async (_caso, body) => {
    await atender(body).expect(400);
    expect(marcar).not.toHaveBeenCalled();
  });

  it('400 si el id de la alerta no es un UUID', async () => {
    await atender(
      { motivo: MOTIVO },
      '/admin/participantes/P-7F3A91C2/alertas/no-uuid/atender',
    ).expect(400);
  });

  it('403 sin token CSRF', async () => {
    await request(app.getHttpServer())
      .post(RUTA)
      .send({ motivo: MOTIVO })
      .expect(403);
    expect(marcar).not.toHaveBeenCalled();
  });

  it('403 SIN_PERMISO_INDIVIDUAL con el mensaje de RF-147 si el ADMINISTRATIVO no tiene permiso', async () => {
    vigente.mockResolvedValue(false);
    const r = await atender().expect(403);
    expect(r.body).toEqual({
      status: 403,
      codigo: 'SIN_PERMISO_INDIVIDUAL',
      mensaje: MENSAJE_SIN_PERMISO_GESTION_ALERTAS,
    });
    expect(marcar).not.toHaveBeenCalled();
  });

  it('COORDINADOR_PSI no necesita permiso individual', async () => {
    await atender().set('x-test-role', 'COORDINADOR_PSI').expect(200);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('403 para un estudiante', async () => {
    await atender().set('x-test-role', 'ESTUDIANTE').expect(403);
    expect(marcar).not.toHaveBeenCalled();
  });

  it.each([
    ['ALERTA_YA_ATENDIDA' as const, 409],
    ['ALERTA_NO_ENCONTRADA' as const, 404],
    ['ERROR_GESTION_ALERTA' as const, 500],
  ])(
    '%s responde %i con { status, codigo, mensaje }',
    async (codigo, status) => {
      marcar.mockRejectedValue(new GestionAlertaException(codigo));
      const r = await atender().expect(status);
      expect(r.body).toMatchObject({ status, codigo });
    },
  );
});
