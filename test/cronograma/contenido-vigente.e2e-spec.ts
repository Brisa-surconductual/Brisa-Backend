import { createHash } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ModuloApiKeyHasherPort } from '../../src/modules/cronograma/application/ports/modulo-api-key-hasher.port';
import { ModuloInternoCredentialsConfigPort } from '../../src/modules/cronograma/application/ports/modulo-interno-credentials-config.port';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../../src/modules/cronograma/application/use-cases/contenido/consultar-contenido-vigente-usuario.use-case';
import { ModuloSistema } from '../../src/modules/cronograma/domain/entities/modulo-sistema.entity';
import { EstadoContenido } from '../../src/modules/cronograma/domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../src/modules/cronograma/domain/enums/tipo-contenido.enum';
import { CronogramaUsuarioNoAsignadoException } from '../../src/modules/cronograma/domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { ModuloSistemaRepository } from '../../src/modules/cronograma/domain/repositories/modulo-sistema.repository';
import { Sha256ModuloApiKeyHasher } from '../../src/modules/cronograma/infrastructure/security/sha256-modulo-api-key-hasher';
import { ContenidoVigenteController } from '../../src/modules/cronograma/presentation/contenido-vigente.controller';
import { ModuloInternoAuthGuard } from '../../src/modules/cronograma/presentation/guards/modulo-interno-auth.guard';

describe('Cronograma - contenido vigente interno (e2e)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const apiKey = 'api-key-interna-segura-de-32-bytes-minimo';
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
  const consultarContenido = { execute: jest.fn() };
  const buscarActivoPorCodigo = jest.fn();
  const obtenerApiKeyHash = jest.fn((codigo: string) =>
    codigo === 'CHAT' ? apiKeyHash : null,
  );
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContenidoVigenteController],
      providers: [
        ModuloInternoAuthGuard,
        {
          provide: ConsultarContenidoVigenteUsuarioUseCase,
          useValue: consultarContenido,
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
    buscarActivoPorCodigo.mockResolvedValue(
      new ModuloSistema('00000000-0000-4000-8000-000000000003', 'CHAT', 'Chat'),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna el contenido vigente al módulo autenticado', async () => {
    consultarContenido.execute.mockResolvedValue([crearContenidoResponse()]);

    await solicitudAutorizada()
      .query({ fecha_consulta: '2026-09-15T12:00:00.000Z' })
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect([crearContenidoResponse()]);

    expect(consultarContenido.execute).toHaveBeenCalledWith(
      idUsuario,
      new Date('2026-09-15T12:00:00.000Z'),
    );
  });

  it('retorna 204 sin cuerpo cuando no hay contenido vigente', async () => {
    consultarContenido.execute.mockResolvedValue([]);

    await solicitudAutorizada().expect(204).expect('');
  });

  it('propaga 404 cuando el usuario no tiene cronograma asignado', async () => {
    consultarContenido.execute.mockRejectedValue(
      new CronogramaUsuarioNoAsignadoException(),
    );

    await solicitudAutorizada()
      .expect(404)
      .expect((respuesta) => {
        expect(respuesta.text).toContain(
          'El usuario no tiene un cronograma asignado.',
        );
      });
  });

  it('retorna 403 para un módulo fuera de la lista autorizada', async () => {
    await request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/contenidos-vigentes`)
      .set('X-Module-Code', 'DIARIO')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(403)
      .expect((respuesta) => {
        expect(respuesta.text).toContain(
          'El módulo no está autorizado para consultar la disponibilidad de contenido.',
        );
      });

    expect(consultarContenido.execute).not.toHaveBeenCalled();
  });

  it('retorna 403 cuando la API key no coincide', async () => {
    await request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/contenidos-vigentes`)
      .set('X-Module-Code', 'CHAT')
      .set('Authorization', `Bearer ${'x'.repeat(40)}`)
      .expect(403);

    expect(consultarContenido.execute).not.toHaveBeenCalled();
  });

  it('retorna 403 cuando falta la credencial del módulo', async () => {
    await request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/contenidos-vigentes`)
      .expect(403);

    expect(consultarContenido.execute).not.toHaveBeenCalled();
  });

  it('retorna 400 ante una fecha de consulta inválida después de autenticar', async () => {
    await solicitudAutorizada()
      .query({ fecha_consulta: 'fecha-invalida' })
      .expect(400);

    expect(consultarContenido.execute).not.toHaveBeenCalled();
  });

  function solicitudAutorizada(): request.Test {
    return request(app.getHttpServer())
      .get(`/cronograma/interno/usuarios/${idUsuario}/contenidos-vigentes`)
      .set('X-Module-Code', 'CHAT')
      .set('Authorization', `Bearer ${apiKey}`);
  }

  function crearContenidoResponse(): Record<string, unknown> {
    return {
      id_contenido: '00000000-0000-4000-8000-000000000002',
      id_contenido_cronograma: '00000000-0000-4000-8000-000000000004',
      nombre_contenido: 'Prevención de recaídas',
      tipo_contenido: TipoContenido.INFORMATIVO,
      id_unidad_temporal: '00000000-0000-4000-8000-000000000005',
      nombre_unidad: 'Semana 2',
      orden_unidad: 2,
      orden_contenido: 1,
      fecha_inicio_disponibilidad: '2026-01-08T00:00:00.000Z',
      fecha_fin_disponibilidad: '2026-01-15T00:00:00.000Z',
      estado_disponibilidad: EstadoContenido.ACTIVO,
    };
  }
});
