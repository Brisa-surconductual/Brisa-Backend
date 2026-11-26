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
import { ListarAlertasPendientesUseCase } from '../../../application/use-cases/gestion-alertas/listar-alertas-pendientes.use-case';
import { MarcarAlertaAtendidaUseCase } from '../../../application/use-cases/gestion-alertas/marcar-alerta-atendida.use-case';
import { GestionAlertasController } from './gestion-alertas.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const COHORTE = 'c0000000-0000-4000-8000-000000000001';
const ID_ALERTA = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const PENDIENTES = `/admin/cohortes/${COHORTE}/alertas/pendientes`;
const ATENDER = `/admin/alertas/${ID_ALERTA}/atender`;
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

const bandeja = {
  items: [
    {
      id_alerta: ID_ALERTA,
      tipo_alerta: 'CRAVING_ELEVADO',
      fecha_generacion: '2026-11-22T01:40:00Z',
      codigo_participante: 'P-7F3A91C2',
    },
  ],
  total: 1,
  offset: 0,
  limit: 20,
};

describe('Gestión de alertas RF-146 / RF-147 (HTTP)', () => {
  let app: INestApplication<App>;
  const listar = jest.fn();
  const marcar = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [GestionAlertasController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        {
          provide: ListarAlertasPendientesUseCase,
          useValue: { execute: listar },
        },
        { provide: MarcarAlertaAtendidaUseCase, useValue: { execute: marcar } },
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
    listar.mockReset().mockResolvedValue(bandeja);
    marcar.mockReset().mockResolvedValue({
      id_alerta: ID_ALERTA,
      estado: 'ATENDIDA',
      fecha_atencion: '2026-11-23T03:20:00.000Z',
    });
  });

  afterAll(() => app?.close());

  const servidor = () => app.getHttpServer();
  const atender = (
    body: object = { accion: 'MARCAR_ATENDIDA', motivo: MOTIVO },
    ruta = ATENDER,
  ) => request(servidor()).post(ruta).set('X-CSRF-Token', 'token').send(body);

  describe('GET alertas pendientes (RF-146)', () => {
    it('200 con el contrato, sin caché', async () => {
      const r = await request(servidor())
        .get(`${PENDIENTES}?tipo_alerta=CRAVING_ELEVADO&offset=0&limit=20`)
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(r.body).toEqual(bandeja);
      expect(listar).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuario: ID_ADMIN }),
        COHORTE,
        { tipo_alerta: 'CRAVING_ELEVADO', offset: 0, limit: 20 },
      );
    });

    it('valores por defecto de la paginación', async () => {
      await request(servidor()).get(PENDIENTES).expect(200);
      expect(listar).toHaveBeenCalledWith(expect.anything(), COHORTE, {
        offset: 0,
        limit: 20,
      });
    });

    it('204 sin cuerpo si no hay pendientes', async () => {
      listar.mockResolvedValue(null);
      const r = await request(servidor()).get(PENDIENTES).expect(204);
      expect(r.text).toBe('');
    });

    it.each([
      ['tipo_alerta desconocido', '?tipo_alerta=OTRA'],
      ['limit mayor que 100', '?limit=101'],
      ['offset negativo', '?offset=-1'],
    ])('400 con %s', async (_caso, query) => {
      await request(servidor()).get(`${PENDIENTES}${query}`).expect(400);
      expect(listar).not.toHaveBeenCalled();
    });

    it('400 si el id de la cohorte no es UUID', async () => {
      await request(servidor())
        .get('/admin/cohortes/123/alertas/pendientes')
        .expect(400);
    });

    it.each([
      ['M05_NO_DISPONIBLE' as const, 503],
      ['COHORTE_NO_ENCONTRADA' as const, 404],
    ])(
      '%s responde %i con { status, codigo, mensaje }',
      async (codigo, status) => {
        listar.mockRejectedValue(new GestionAlertaException(codigo));
        const r = await request(servidor()).get(PENDIENTES).expect(status);
        expect(r.body).toMatchObject({ status, codigo });
      },
    );
  });

  describe('POST atender (RF-147)', () => {
    it('200 con el contrato; tipo y participante no se reciben del cliente', async () => {
      const r = await atender({
        accion: 'MARCAR_ATENDIDA',
        motivo: `  ${MOTIVO}  `,
      })
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(r.body).toEqual({
        id_alerta: ID_ALERTA,
        estado: 'ATENDIDA',
        fecha_atencion: '2026-11-23T03:20:00.000Z',
      });
      expect(marcar).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuario: ID_ADMIN }),
        ID_ALERTA,
        MOTIVO,
      );
    });

    it.each([
      ['sin motivo', { accion: 'MARCAR_ATENDIDA' }],
      ['motivo corto', { accion: 'MARCAR_ATENDIDA', motivo: 'revisado' }],
      ['sin accion', { motivo: MOTIVO }],
      ['accion distinta', { accion: 'REVERTIR', motivo: MOTIVO }],
      [
        'tipo enviado por el cliente',
        {
          accion: 'MARCAR_ATENDIDA',
          motivo: MOTIVO,
          tipo_alerta: 'INACTIVIDAD',
        },
      ],
      [
        'participante enviado por el cliente',
        {
          accion: 'MARCAR_ATENDIDA',
          motivo: MOTIVO,
          codigo_participante: 'P-7F3A91C2',
        },
      ],
    ])('400 %s, sin ejecutar la acción', async (_caso, body) => {
      await atender(body).expect(400);
      expect(marcar).not.toHaveBeenCalled();
    });

    it('400 si el id de la alerta no es UUID', async () => {
      await atender(undefined, '/admin/alertas/no-uuid/atender').expect(400);
    });

    it('403 sin token CSRF', async () => {
      await request(servidor())
        .post(ATENDER)
        .send({ accion: 'MARCAR_ATENDIDA', motivo: MOTIVO })
        .expect(403);
      expect(marcar).not.toHaveBeenCalled();
    });

    it.each([
      ['ALERTA_NO_ENCONTRADA' as const, 404],
      ['ALERTA_YA_ATENDIDA' as const, 409],
      ['ERROR_TRANSACCION' as const, 500],
    ])('%s responde %i con el cuerpo del contrato', async (codigo, status) => {
      const error = new GestionAlertaException(codigo);
      marcar.mockRejectedValue(error);
      const r = await atender().expect(status);
      expect(r.body).toEqual(error.getResponse());
    });
  });

  describe('acceso', () => {
    it('ADMINISTRATIVO sin permiso individual y COORDINADOR_PSI pueden atender', async () => {
      await atender().expect(200);
      await atender().set('x-test-role', 'COORDINADOR_PSI').expect(200);
    });

    it.each([
      ['GET', PENDIENTES],
      ['POST', ATENDER],
    ])('403 para un estudiante en %s %s', async (metodo, ruta) => {
      const r =
        metodo === 'GET'
          ? request(servidor()).get(ruta)
          : atender(undefined, ruta);
      await r.set('x-test-role', 'ESTUDIANTE').expect(403);
      expect(listar).not.toHaveBeenCalled();
      expect(marcar).not.toHaveBeenCalled();
    });
  });
});
