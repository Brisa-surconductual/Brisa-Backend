import { createHash } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ModuloApiKeyHasherPort } from '../../src/modules/cronograma/application/ports/modulo-api-key-hasher.port';
import { ModuloInternoCredentialsConfigPort } from '../../src/modules/cronograma/application/ports/modulo-interno-credentials-config.port';
import { ConsultarInformacionTemporalUsuarioUseCase } from '../../src/modules/cronograma/application/use-cases/cronograma/consultar-informacion-temporal-usuario.use-case';
import { ModuloSistema } from '../../src/modules/cronograma/domain/entities/modulo-sistema.entity';
import { CronogramaActivoUsuarioNoEncontradoException } from '../../src/modules/cronograma/domain/exeption/cronograma/cronograma-activo-usuario-no-encontrado.exception';
import { ModuloSistemaRepository } from '../../src/modules/cronograma/domain/repositories/modulo-sistema.repository';
import { Sha256ModuloApiKeyHasher } from '../../src/modules/cronograma/infrastructure/security/sha256-modulo-api-key-hasher';
import { ModuloInternoAuthGuard } from '../../src/modules/cronograma/presentation/guards/modulo-interno-auth.guard';
import { InformacionTemporalController } from '../../src/modules/cronograma/presentation/informacion-temporal.controller';

describe('Cronograma - información temporal interna (e2e)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idModulo = '00000000-0000-4000-8000-000000000010';
  const apiKey = 'api-key-interna-segura-de-32-bytes-minimo';
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
  const codigosAutorizados = ['CHAT', 'SEGUIM', 'GAMIF', 'NOTIF'];
  const consultarInformacion = { execute: jest.fn() };
  const buscarActivoPorCodigo = jest.fn();
  const obtenerApiKeyHash = jest.fn((codigo: string) =>
    codigosAutorizados.includes(codigo) ? apiKeyHash : null,
  );
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InformacionTemporalController],
      providers: [
        ModuloInternoAuthGuard,
        {
          provide: ConsultarInformacionTemporalUsuarioUseCase,
          useValue: consultarInformacion,
        },
        {
          provide: ModuloSistemaRepository,
          useValue: {
            listarActivos: jest.fn(),
            buscarActivoPorCodigo,
          },
        },
        {
          provide: ModuloInternoCredentialsConfigPort,
          useValue: { obtenerApiKeyHash },
        },
        {
          provide: ModuloApiKeyHasherPort,
          useClass: Sha256ModuloApiKeyHasher,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    jest.clearAllMocks();
    buscarActivoPorCodigo.mockImplementation((codigo: string) =>
      Promise.resolve(new ModuloSistema(idModulo, codigo, codigo)),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna ubicación y contenidos usando el mismo instante de consulta', async () => {
    consultarInformacion.execute.mockResolvedValue(crearRespuesta());

    await solicitudAutorizada('CHAT')
      .query({ fecha_consulta: '2026-09-15T12:00:00.000Z' })
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect(crearRespuesta());

    expect(consultarInformacion.execute).toHaveBeenCalledWith(
      idUsuario,
      new Date('2026-09-15T12:00:00.000Z'),
    );
  });

  it('retorna 200 y conserva la ubicación cuando no hay contenido vigente', async () => {
    consultarInformacion.execute.mockResolvedValue({
      ...crearRespuesta(),
      contenidos_vigentes: [],
    });

    await solicitudAutorizada('CHAT')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body).toHaveProperty(
          'ubicacion_temporal.id_usuario',
          idUsuario,
        );
        expect(respuesta.body).toMatchObject({ contenidos_vigentes: [] });
      });
  });

  it.each(['CHAT', 'SEGUIM', 'GAMIF', 'NOTIF'])(
    'autoriza al módulo consumidor %s',
    async (codigoModulo) => {
      consultarInformacion.execute.mockResolvedValue(crearRespuesta());

      await solicitudAutorizada(codigoModulo).expect(200);
      expect(buscarActivoPorCodigo).toHaveBeenCalledWith(codigoModulo);
    },
  );

  it('retorna 404 cuando el usuario no tiene cronograma activo', async () => {
    consultarInformacion.execute.mockRejectedValue(
      new CronogramaActivoUsuarioNoEncontradoException(),
    );

    await solicitudAutorizada('CHAT')
      .expect(404)
      .expect((respuesta) => {
        expect(respuesta.text).toContain(
          'El usuario no tiene un cronograma activo asignado.',
        );
      });
  });

  it('retorna 403 para un módulo fuera de la lista autorizada', async () => {
    await solicitudAutorizada('DIARIO').expect(403);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
    expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
  });

  it('retorna 403 cuando la API key no coincide', async () => {
    await request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/informacion-temporal`)
      .set('X-Module-Code', 'CHAT')
      .set('Authorization', `Bearer ${'x'.repeat(40)}`)
      .expect(403);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  it('retorna 403 cuando faltan las credenciales del módulo', async () => {
    await request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/informacion-temporal`)
      .expect(403);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  it('retorna 400 ante fecha o usuario inválidos', async () => {
    await solicitudAutorizada('CHAT')
      .query({ fecha_consulta: 'fecha-invalida' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/cronograma/interno/usuarios/id-invalido/informacion-temporal')
      .set('X-Module-Code', 'CHAT')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(400);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  it('no expone operaciones de escritura sobre el contrato RF-23', async () => {
    await request(app.getHttpServer())
      .patch(`/cronograma/interno/usuarios/${idUsuario}/informacion-temporal`)
      .set('X-Module-Code', 'CHAT')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ cronograma_finalizado: true })
      .expect(404);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  function solicitudAutorizada(codigoModulo: string): request.Test {
    return request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/informacion-temporal`)
      .set('X-Module-Code', codigoModulo)
      .set('Authorization', `Bearer ${apiKey}`);
  }

  function crearRespuesta(): Record<string, unknown> {
    return {
      ubicacion_temporal: {
        id_usuario: idUsuario,
        id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
        id_cronograma: '00000000-0000-4000-8000-000000000003',
        id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
        nombre_unidad: 'Semana 2',
        orden_unidad: 2,
        fecha_calculo: '2026-09-15T12:00:00.000Z',
        tiempo_efectivo_transcurrido_segundos: 604800,
        cronograma_finalizado: false,
        mensaje: null,
      },
      contenidos_vigentes: [
        {
          id_contenido: '00000000-0000-4000-8000-000000000005',
          id_contenido_cronograma: '00000000-0000-4000-8000-000000000006',
          nombre_contenido: 'Prevención de recaídas',
          tipo_contenido: 'INFORMATIVO',
          id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
          nombre_unidad: 'Semana 2',
          orden_unidad: 2,
          orden_contenido: 1,
          fecha_inicio_disponibilidad: '2026-01-08T00:00:00.000Z',
          fecha_fin_disponibilidad: '2026-01-15T00:00:00.000Z',
          estado_disponibilidad: 'ACTIVO',
        },
      ],
    };
  }
});
