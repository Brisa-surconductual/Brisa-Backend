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
import { SessionTokenHasher } from '../../../../usuarios/application/ports/session-token-hasher';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { variablesSeed } from '../../../application/support/testing/taxonomia-variables.fixture';
import { CambiarEstadoVariableTaxonomiaUseCase } from '../../../application/use-cases/taxonomia/cambiar-estado-variable-taxonomia.use-case';
import { ConsultarTaxonomiaVariablesUseCase } from '../../../application/use-cases/taxonomia/consultar-taxonomia-variables.use-case';
import { CrearVariableTaxonomiaUseCase } from '../../../application/use-cases/taxonomia/crear-variable-taxonomia.use-case';
import {
  TaxonomiaVariablesRepository,
  TaxonomiaVariablesTransaccion,
} from '../../../domain/repositories/taxonomia-variables.repository';
import { VersionTaxonomia } from '../../../domain/value-objects/version-taxonomia.vo';
import { instalarFiltroConversacionalPrueba } from '../../support/testing/filtro-error-conversacional.fixture';
import { TaxonomiaVariablesController } from './taxonomia-variables.controller';

describe('RF-30B /chat/taxonomia-variables (HTTP)', () => {
  const ruta = '/chat/taxonomia-variables';
  const actor = '30b00000-0000-4000-8000-0000000000cc';
  let app: INestApplication<App>;

  const tx = {
    bloquearPorCodigo: jest.fn(),
    existeCodigo: jest.fn(),
    estaEnUsoPublicado: jest.fn(),
    insertar: jest.fn(),
    actualizarEstado: jest.fn(),
    versionActual: jest.fn(),
    registrarVersion: jest.fn(),
  };
  const repository = {
    versionActual: jest.fn(),
    listar: jest.fn(),
    buscarPorCodigo: jest.fn(),
    ejecutar: jest.fn(),
  };

  const autenticar = (c: ExecutionContext) => {
    const req = c.switchToHttp().getRequest<{
      headers: Record<string, string>;
      autenticacion?: unknown;
    }>();
    if (req.headers['x-test-auth'] === 'ausente')
      throw new UnauthorizedException();
    req.autenticacion = {
      usuario: {
        id_usuario: actor,
        rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
      },
      sesion: { alcance_sesion: 'COMPLETA', csrf_token_hash: 'hash-local' },
    };
    return true;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [TaxonomiaVariablesController],
      providers: [
        ConsultarTaxonomiaVariablesUseCase,
        CrearVariableTaxonomiaUseCase,
        CambiarEstadoVariableTaxonomiaUseCase,
        RolesGuard,
        { provide: TaxonomiaVariablesRepository, useValue: repository },
        {
          provide: SessionTokenHasher,
          useValue: {
            compare: (t: string, h: string) =>
              t === 'csrf-local' && h === 'hash-local',
          },
        },
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

  beforeEach(() => {
    jest.resetAllMocks();
    repository.ejecutar.mockImplementation(
      <T>(op: (t: TaxonomiaVariablesTransaccion) => Promise<T>) => op(tx),
    );
    repository.versionActual.mockResolvedValue(VersionTaxonomia.de('1.0'));
    tx.versionActual.mockResolvedValue(VersionTaxonomia.de('1.0'));
    tx.registrarVersion.mockResolvedValue(VersionTaxonomia.de('1.1'));
    tx.existeCodigo.mockResolvedValue(false);
    tx.estaEnUsoPublicado.mockResolvedValue(false);
    tx.insertar.mockImplementation((v: { conId: (id: string) => unknown }) =>
      Promise.resolve(v.conId('nuevo')),
    );
  });

  afterAll(() => app?.close());

  describe('GET', () => {
    it('200 con data, no-store y solo habilitadas por defecto', async () => {
      repository.listar.mockResolvedValue([
        { variable: variablesSeed.situacionRiesgo, enUsoPublicado: false },
      ]);
      const r = await request(app.getHttpServer())
        .get(ruta)
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(repository.listar).toHaveBeenCalledWith(false);
      expect(r.body as unknown).toEqual({
        data: {
          version: '1.0',
          variables: [
            expect.objectContaining({
              codigo: 'SITUACION_RIESGO',
              tipo_valor: 'BOOLEANO',
              tipos_entrada_permitidos: ['BOOLEANO'],
              etiquetas: { true: 'RIESGO_PRESENTE', false: 'RIESGO_AUSENTE' },
              en_uso_publicado: false,
            }),
          ],
        },
      });
    });

    it('incluir_deshabilitadas=true lista todas', async () => {
      repository.listar.mockResolvedValue([]);
      await request(app.getHttpServer())
        .get(`${ruta}?incluir_deshabilitadas=true`)
        .expect(200);
      expect(repository.listar).toHaveBeenCalledWith(true);
    });

    it('401 sin sesión y 403 para un estudiante', async () => {
      await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-auth', 'ausente')
        .expect(401);
      await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-role', 'ESTUDIANTE')
        .expect(403);
      expect(repository.listar).not.toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    const body = {
      codigo: 'LUGAR_CONSUMO',
      nombre: 'Lugar de consumo',
      tipo_valor: 'CATEGORIA',
      valores: ['CASA', 'UNIVERSIDAD'],
      tipos_entrada_permitidos: ['OPCION_UNICA'],
      etiquetas: {},
    };
    const post = (datos: object, csrf: string | null = 'csrf-local') => {
      const req = request(app.getHttpServer()).post(ruta);
      return (csrf === null ? req : req.set('X-CSRF-Token', csrf)).send(datos);
    };

    it('201 con la variable y la nueva versión; el actor sale de la sesión', async () => {
      const r = await post(body).expect(201);
      expect(r.body as unknown).toMatchObject({
        data: {
          version: '1.1',
          variable: { codigo: 'LUGAR_CONSUMO', habilitada: true },
        },
      });
      expect(tx.insertar).toHaveBeenCalledWith(expect.anything(), actor);
    });

    it('403 sin CSRF, sin escribir', async () => {
      await post(body, null).expect(403);
      expect(repository.ejecutar).not.toHaveBeenCalled();
    });

    it('400 por forma inválida y 422 por definición incoherente', async () => {
      await post({ ...body, tipo_valor: 'TEXTO' }).expect(400);
      const r = await post({
        ...body,
        tipos_entrada_permitidos: ['BOOLEANO'],
      }).expect(422);
      expect(r.body as unknown).toMatchObject({
        codigo: 'DEFINICION_VARIABLE_INVALIDA',
      });
    });

    it('409 VARIABLE_DUPLICADA', async () => {
      tx.existeCodigo.mockResolvedValue(true);
      const r = await post(body).expect(409);
      expect(r.body as unknown).toMatchObject({ codigo: 'VARIABLE_DUPLICADA' });
    });
  });

  describe('PATCH', () => {
    const patch = (codigo: string, datos: object) =>
      request(app.getHttpServer())
        .patch(`${ruta}/${codigo}`)
        .set('X-CSRF-Token', 'csrf-local')
        .send(datos);

    it('200 al deshabilitar una variable sin uso publicado', async () => {
      tx.bloquearPorCodigo.mockResolvedValue(variablesSeed.nivelCraving);
      const r = await patch('NIVEL_CRAVING', { habilitada: false }).expect(200);
      expect(r.body as unknown).toMatchObject({
        data: { version: '1.1', variable: { habilitada: false } },
      });
    });

    it('409 VARIABLE_EN_USO_PUBLICADO', async () => {
      tx.bloquearPorCodigo.mockResolvedValue(variablesSeed.nivelCraving);
      tx.estaEnUsoPublicado.mockResolvedValue(true);
      const r = await patch('NIVEL_CRAVING', { habilitada: false }).expect(409);
      expect(r.body as unknown).toMatchObject({
        codigo: 'VARIABLE_EN_USO_PUBLICADO',
      });
      expect(tx.actualizarEstado).not.toHaveBeenCalled();
    });

    it('404 VARIABLE_NO_ENCONTRADA y 400 sin habilitada', async () => {
      tx.bloquearPorCodigo.mockResolvedValue(null);
      const r = await patch('NO_EXISTE', { habilitada: true }).expect(404);
      expect(r.body as unknown).toMatchObject({
        codigo: 'VARIABLE_NO_ENCONTRADA',
      });
      await patch('NIVEL_CRAVING', {}).expect(400);
    });
  });
});
