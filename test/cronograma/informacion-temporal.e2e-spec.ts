import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConsultarInformacionTemporalUsuarioUseCase } from '../../src/modules/cronograma/application/use-cases/cronograma/consultar-informacion-temporal-usuario.use-case';
import { CronogramaActivoUsuarioNoEncontradoException } from '../../src/modules/cronograma/domain/exeption/cronograma/cronograma-activo-usuario-no-encontrado.exception';
import { InformacionTemporalController } from '../../src/modules/cronograma/presentation/informacion-temporal.controller';
import { CsrfSessionGuard } from '../../src/modules/usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../src/modules/usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../src/shared/presentation/guards/role-guard';

describe('Cronograma - información temporal de participante (e2e)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const url = `/cronograma/participantes/${idUsuario}/informacion-temporal`;
  const consultarInformacion = { execute: jest.fn() };
  const autorizarRol = jest.fn(() => true);
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InformacionTemporalController],
      providers: [
        {
          provide: ConsultarInformacionTemporalUsuarioUseCase,
          useValue: consultarInformacion,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: autorizarRol })
      .compile();

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
    autorizarRol.mockReturnValue(true);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('retorna ubicación y contenidos usando el mismo instante de consulta', async () => {
    consultarInformacion.execute.mockResolvedValue(crearRespuesta());

    await request(app.getHttpServer())
      .get(url)
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

    await request(app.getHttpServer())
      .get(url)
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body).toHaveProperty(
          'ubicacion_temporal.id_usuario',
          idUsuario,
        );
        expect(respuesta.body).toMatchObject({ contenidos_vigentes: [] });
      });
  });

  it('retorna 404 cuando el usuario no tiene cronograma activo', async () => {
    consultarInformacion.execute.mockRejectedValue(
      new CronogramaActivoUsuarioNoEncontradoException(),
    );

    await request(app.getHttpServer())
      .get(url)
      .expect(404)
      .expect((respuesta) => {
        expect(respuesta.text).toContain(
          'El usuario no tiene un cronograma activo asignado.',
        );
      });
  });

  it('retorna 403 cuando el rol no está autorizado', async () => {
    autorizarRol.mockReturnValue(false);

    await request(app.getHttpServer()).get(url).expect(403);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  it('retorna 400 ante fecha o usuario inválidos', async () => {
    await request(app.getHttpServer())
      .get(url)
      .query({ fecha_consulta: 'fecha-invalida' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/cronograma/participantes/id-invalido/informacion-temporal')
      .expect(400);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });

  it('no expone operaciones de escritura sobre el contrato RF-23', async () => {
    await request(app.getHttpServer())
      .patch(url)
      .send({ cronograma_finalizado: true })
      .expect(404);

    expect(consultarInformacion.execute).not.toHaveBeenCalled();
  });
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
