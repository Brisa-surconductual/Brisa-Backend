import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { GestionBaseCronogramaController } from '../../src/modules/cronograma/presentation/gestion-base-cronograma.controller';
import { ActivarCronogramaUseCase } from '../../src/modules/cronograma/application/use-cases/cronograma/activar-cronograma.use-case';
import { ConsultarMiCronogramaUseCase } from '../../src/modules/cronograma/application/use-cases/cronograma/consultar-mi-cronograma.use-case';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../../src/modules/cronograma/application/use-cases/contenido/consultar-contenido-vigente-usuario.use-case';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';
import { SessionTokenHasher } from '../../src/modules/usuarios/application/ports/session-token-hasher';

describe('Cronograma base - HTTP, roles, sesión y CSRF', () => {
  let app: INestApplication<App>;
  const id = '00000000-0000-4000-8000-000000000001';
  const executeActivar = jest.fn();
  const executeConsultar = jest.fn();
  const executeContenidos = jest.fn();
  const endpoint = '/cronograma/' + id + '/activar';
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [GestionBaseCronogramaController],
      providers: [
        {
          provide: ActivarCronogramaUseCase,
          useValue: { execute: executeActivar },
        },
        {
          provide: ConsultarMiCronogramaUseCase,
          useValue: { execute: executeConsultar },
        },
        {
          provide: ConsultarContenidoVigenteUsuarioUseCase,
          useValue: { execute: executeContenidos },
        },
        {
          provide: SessionTokenHasher,
          useValue: {
            compare: (value: string, hash: string) => value === hash,
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: Record<string, string>;
            autenticacion: unknown;
          }>();
          if (!req.headers['x-test-role']) throw new UnauthorizedException();
          req.autenticacion = {
            usuario: { id_usuario: id, rol: req.headers['x-test-role'] },
            sesion: {
              alcance_sesion: req.headers['x-test-scope'] ?? 'COMPLETA',
              csrf_token_hash: 'fixture-csrf',
            },
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
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
    jest.resetAllMocks();
    executeActivar.mockResolvedValue({ id_cronograma: id, estado: 'ACTIVO' });
    executeConsultar.mockResolvedValue({
      id_cronograma: id,
      nombre: 'Mi programa',
    });
    executeContenidos.mockResolvedValue([]);
  });
  afterAll(async () => app.close());
  it('activa con sesión administrativa completa y confirmación', async () => {
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-test-role', 'ADMINISTRATIVO')
      .set('x-csrf-token', 'fixture-csrf')
      .send({ confirmacion_activacion: true })
      .expect(200)
      .expect({ id_cronograma: id, estado: 'ACTIVO' });
    expect(executeActivar).toHaveBeenCalledWith(id);
  });
  it('rechaza visitante sin sesión', async () => {
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ confirmacion_activacion: true })
      .expect(401);
    expect(executeActivar).not.toHaveBeenCalled();
  });
  it('rechaza estudiante que intenta activar', async () => {
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-test-role', 'ESTUDIANTE')
      .set('x-csrf-token', 'fixture-csrf')
      .send({ confirmacion_activacion: true })
      .expect(403);
  });
  it('rechaza escritura sin CSRF', async () => {
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-test-role', 'ADMINISTRATIVO')
      .send({ confirmacion_activacion: true })
      .expect(403);
  });
  it('rechaza sesión de alcance limitado', async () => {
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-test-role', 'ADMINISTRATIVO')
      .set('x-test-scope', 'LIMITADA')
      .set('x-csrf-token', 'fixture-csrf')
      .send({ confirmacion_activacion: true })
      .expect(403);
  });
  it.each([
    {},
    { confirmacion_activacion: false },
    { confirmacion_activacion: 'true' },
    { confirmacion_activacion: true, estado: 'ACTIVO' },
  ])('valida confirmación y body %j', async (body) => {
    await request(app.getHttpServer())
      .post(endpoint)
      .set('x-test-role', 'ADMINISTRATIVO')
      .set('x-csrf-token', 'fixture-csrf')
      .send(body)
      .expect(400);
    expect(executeActivar).not.toHaveBeenCalled();
  });
  it('valida UUID de la ruta', async () => {
    await request(app.getHttpServer())
      .post('/cronograma/inexistente/activar')
      .set('x-test-role', 'ADMINISTRATIVO')
      .set('x-csrf-token', 'fixture-csrf')
      .send({ confirmacion_activacion: true })
      .expect(400);
  });
  it('consulta el cronograma de la sesión e impide elegir otro usuario', async () => {
    await request(app.getHttpServer())
      .get('/cronograma/me?id_usuario=otro')
      .set('x-test-role', 'ESTUDIANTE')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(executeConsultar).toHaveBeenCalledWith(id);
  });
  it('retorna contenido vacío como 204 sin depender de CHAT', async () => {
    await request(app.getHttpServer())
      .get('/cronograma/me/contenidos-vigentes')
      .set('x-test-role', 'ESTUDIANTE')
      .expect(204);
    expect(executeContenidos).toHaveBeenCalledWith(id);
  });
  it('retorna contenido existente con 200', async () => {
    executeContenidos.mockResolvedValue([
      { nombre_contenido: 'Actividad vigente' },
    ]);
    await request(app.getHttpServer())
      .get('/cronograma/me/contenidos-vigentes')
      .set('x-test-role', 'ESTUDIANTE')
      .expect(200)
      .expect([{ nombre_contenido: 'Actividad vigente' }]);
  });
  it('no permite la consulta propia de estudiante con sesión administrativa', async () => {
    await request(app.getHttpServer())
      .get('/cronograma/me')
      .set('x-test-role', 'ADMINISTRATIVO')
      .expect(403);
  });
});
