import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { HistorialConversacionalInconsistenteException } from '../../../application/exceptions/historial-conversacional-inconsistente.exception';
import { ConsultarTrazabilidadSesionUseCase } from '../../../application/use-cases/sesion/consultar-trazabilidad-sesion.use-case';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import { instalarFiltroConversacionalPrueba } from '../../support/testing/filtro-error-conversacional.fixture';
import { TrazabilidadSesionController } from './trazabilidad-sesion.controller';

const idSesion = '00000000-0000-4000-8000-000000000001';
const ruta = `/chat/admin/sesiones/${idSesion}/trazabilidad`;
const datos = {
  id_sesion: idSesion,
  id_participante: 'P-1A2B3C4D',
  registros: [
    {
      secuencia: 1,
      id_nodo: '00000000-0000-4000-8000-00000000000a',
      respuesta_usuario: { valor: 7 },
      id_nodo_destino: null,
      timestamp_interaccion: '2026-11-20T14:00:00.000Z',
    },
  ],
};

describe('GET /chat/admin/sesiones/:id_sesion/trazabilidad (HTTP)', () => {
  let app: INestApplication<App>;
  const casoDeUso = { execute: jest.fn() };
  const autenticar = (c: ExecutionContext) => {
    const req = c.switchToHttp().getRequest<{
      headers: Record<string, string>;
      autenticacion?: unknown;
    }>();
    if (req.headers['x-test-auth'] === 'ausente')
      throw new UnauthorizedException();
    req.autenticacion = {
      usuario: {
        id_usuario: '00000000-0000-4000-8000-0000000000ad',
        rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
      },
      sesion: { alcance_sesion: 'COMPLETA', csrf_token_hash: 'hash' },
    };
    return true;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [TrazabilidadSesionController],
      providers: [
        RolesGuard,
        { provide: ConsultarTrazabilidadSesionUseCase, useValue: casoDeUso },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    instalarFiltroConversacionalPrueba(app);
    await app.init();
  });
  beforeEach(() => casoDeUso.execute.mockReset().mockResolvedValue(datos));
  afterAll(() => app?.close());

  it('200 envuelto en data, sin caché', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect('Cache-Control', 'no-store');

    expect(r.body as unknown).toEqual({ data: datos });
    expect(casoDeUso.execute).toHaveBeenCalledWith(idSesion);
  });

  it('403 NO_AUTORIZADO para un estudiante', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-role', 'ESTUDIANTE')
      .expect(403);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTORIZADO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it('401 sin sesión', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-auth', 'ausente')
      .expect(401);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTENTICADO');
  });

  it('404 SESION_NO_ENCONTRADA', async () => {
    casoDeUso.execute.mockRejectedValue(
      new SesionConversacionalNoEncontradaException(),
    );

    const r = await request(app.getHttpServer()).get(ruta).expect(404);

    expect(r.body as unknown).toHaveProperty('codigo', 'SESION_NO_ENCONTRADA');
  });

  it('422 HISTORIAL_INCONSISTENTE', async () => {
    casoDeUso.execute.mockRejectedValue(
      new HistorialConversacionalInconsistenteException(),
    );

    const r = await request(app.getHttpServer()).get(ruta).expect(422);

    expect(r.body as unknown).toHaveProperty(
      'codigo',
      'HISTORIAL_INCONSISTENTE',
    );
  });

  it('400 PARAMETRO_INVALIDO con un id que no es UUID', async () => {
    const r = await request(app.getHttpServer())
      .get('/chat/admin/sesiones/no-es-uuid/trazabilidad')
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });
});
